/**
 * Persistent storage for JS/Linux.
 * Kernel driver.
 * Copyright (C) 2011 Kevin van der Vlist
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * Kevin van der Vlist - kevin@kevinvandervlist.nl
 */

/**
 * SimpleBlockDevice driver
 */

#include "linux/fs.h"
#include "linux/init.h"
#include "linux/module.h"
#include <linux/blkdev.h>
#include <linux/hdreg.h>
#include <linux/kernel.h>
#include <linux/slab.h>
#include <linux/types.h>

#include "simpleblock.h"

// Driver is completely free
MODULE_LICENSE("GPL");
// Other Information
MODULE_AUTHOR("Kevin van der Vlist <kevin@vandervlist.nl>");
MODULE_DESCRIPTION("Simple Block device driver for JS/Linux");

// Driver stuff
struct sb_dev {
  unsigned long size; // Sectorsize
  spinlock_t lock; // Locking
  struct gendisk *gd; // Gendisk struct
  struct request_queue *queue; // Request queue
};

static struct sb_dev *sbd = NULL;

/*
 * The HDIO_GETGEO ioctl is handled in blkdev_ioctl(), which
 * calls this. We need to implement getgeo, since we can't
 * use tools such as fdisk to partition the drive otherwise.
 */
int sb_getgeo(struct block_device *bdev, struct hd_geometry * geo) {
  long size;

  PDEBUG("sb_getgeo");
  /* We have no real geometry, of course, so make something up. */
  size = sbd->size;
  geo->cylinders = (size & ~0x3f) >> 6;
  geo->heads = 1;
  geo->sectors = 16;
  geo->start = 0;
  return 0;
}

// The device operations structure.
static struct block_device_operations sb_fops = {
        .owner           = THIS_MODULE,
		.getgeo          = sb_getgeo
};

static void sb_transfer(struct sb_dev *dev, sector_t sector, unsigned long nsect, char *buffer, int write) {
  unsigned int s;
  unsigned int b;
  u8 stat = 0x00;

  #ifdef SB_DEBUG  
  // Evaluate this if only in debug mode.
  if (write) {
	printk(KERN_WARNING "sb_transfer: WRITE sectors %u to %lu", (unsigned)sector, sector + nsect);
  }	else {
	printk(KERN_WARNING "sb_transfer: READ sectors %u to %lu", (unsigned)sector, sector + nsect);
  }
  #endif

  // Each transfer happens in a spinlock:
  spin_lock(&dev->lock);

  for(s = 0; s < nsect; s++) {
	b = 0;
	for(b = 0; b < SECT_SIZE; b++) {
	  // Do work for a write operation...
	  if (write) {
		sb_write_byte(sector + s, b, *buffer++, &stat);
		if(stat) {
		  printk(KERN_WARNING "simpleblock: The device isn't ready. Can't do sb_write_byte\n");
		  goto release_lock;
		}
	  // Or for a read operation.
	  }	else {
	    *buffer++ = sb_read_byte(sector + s, b, &stat);
		if(stat) {
		  printk(KERN_WARNING "simpleblock: The device isn't ready. Can't do sb_read_byte\n");
		  goto release_lock;
		}
	  }
	}
  }

  release_lock:
  // And release the spinlock anyway
  spin_unlock(&dev->lock);

  return;
}

static void sb_request(struct request_queue *q) {
  struct request *req;
  PDEBUG("sb_request");

  req = blk_fetch_request(q);
  while (req != NULL) {
	// Check request type
	if (req == NULL || (req->cmd_type != REQ_TYPE_FS)) {
	  PDEBUG("sb_request: No REQ_TYPE_FS");
	  __blk_end_request_all(req, -EIO);
	  continue;
	}
	// Do transfer
	sb_transfer(sbd, blk_rq_pos(req), blk_rq_cur_sectors(req), req->buffer, rq_data_dir(req));
	if (!__blk_end_request_cur(req, 0) ) {
	  req = blk_fetch_request(q);
	}
  }

  return;
}

// Initialize the device
static int __init sb_init(void) {
  int ret;
  int major = MAJOR_NODE;

  PDEBUG("sb_init");
  // Request registers. REG_MAX is max register
  if(request_region(REG_BASE, REG_MAX, DEV_NAME) == NULL) {
	printk(KERN_WARNING "simpleblock: unable to register IOPorts %03x:%d\n", REG_BASE, REG_MAX);
	return -EBUSY;
  }
  ret = register_blkdev(MAJOR_NODE, DEV_NAME);

  if((ret <= 0) && (!MAJOR_NODE)) {
	printk(KERN_WARNING "simpleblock: unable to register dynamic major number\n");
	return -EBUSY;
  }
  if((ret > 0) && (!MAJOR_NODE)) {
	printk(KERN_NOTICE "simpleblock: Received dynamic major %d\n", ret);
	major = ret;
  }

  if((ret != 0) && (MAJOR_NODE)) {
	printk(KERN_WARNING "simpleblock: unable to register static major number %d\n", MAJOR_NODE);
	return -EBUSY;
  }
  
  // Alloc space for struct
  PDEBUG("kmalloc(sb_dev)");
  sbd = kmalloc(sizeof(struct sb_dev), GFP_KERNEL);
  if(sbd == NULL) {
	goto emergency_clean;
  }
  sbd->size = SECT_SIZE * SECT_CNT;

  // Create spinlock
  PDEBUG("spin_lock_init");
  spin_lock_init(&sbd->lock);
  
  // Init queue
  PDEBUG("blk_init_queue");
  sbd->queue = blk_init_queue(sb_request, &sbd->lock);
  if(sbd->queue == NULL) {
	goto emergency_clean;
  }

  // Init gendisk stuff
  PDEBUG("alloc_disk");
  sbd->gd = alloc_disk(MINORS);
  if(!sbd->gd) {
	goto emergency_clean;
  }
  sbd->gd->major = major;
  
  // Set some extra settings
  PDEBUG("set some extra sbd->gd settings");
  sbd->gd->first_minor = 0;
  sbd->gd->queue = sbd->queue;
  sbd->gd->private_data = sbd;

  // Device ops
  sbd->gd->fops = &sb_fops;

  PDEBUG("set sbd->gd->disk_name");
  strcpy(sbd->gd->disk_name, "sb");
  // Size: number of sectors * size of each sect
  set_capacity(sbd->gd, SECT_CNT);

  // Tell the kernel about the disk
  PDEBUG("add_disk");
  add_disk(sbd->gd);

  PDEBUG("Returning sb_init");
  return 0;

 emergency_clean:
  printk(KERN_WARNING "simpleblock: unable to allocate memory\n");
  release_region(REG_BASE, REG_MAX);
  unregister_blkdev(MAJOR_NODE, DEV_NAME);
  return -ENOMEM;
}

static void __exit sb_exit(void) {
  PDEBUG("sb_exit");
  // Free kernel memory
  put_disk(sbd->gd);
  del_gendisk(sbd->gd);
  kfree(sbd);
  unregister_blkdev(MAJOR_NODE, DEV_NAME);
  release_region(REG_BASE, REG_MAX);
}

// Entrypoints for the kernel
module_init(sb_init);
module_exit(sb_exit);
