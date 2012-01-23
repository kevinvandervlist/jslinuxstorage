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

#ifndef DRIVER_SIMPLE_BLOCK_H
#define DRIVER_SIMPLE_BLOCK_H

#include <linux/types.h>
#include <linux/kernel.h>

// Documentation/devices.txt: major device nodes
// 240-254 block	LOCAL/EXPERIMENTAL USE
// For dynamic allocation: 0
#define MAJOR_NODE 250
// Number of dev numbers (partitions etc)
#define MINORS 16
// Sector count
#define SECT_CNT 2048
// Size of each sector
#define SECT_SIZE 512
// Device name
#define DEV_NAME "simpleblock"

// Register information
#define REG_BASE 0x3F0 // Base register
#define REG_STATUS 0 // R: Status
#define REG_VAL 1 // R/W: The value
#define REG_OPMODE 2 //W: The operation mode (Read / Write)
#define REG_SECLOC 3 // W:FIFO High 8 bit of address + Low 8 bit off address
#define REG_BYTELOC 4 // W:FIFO High 8 bit of byte + Low 8 bit off byte
#define REG_DO_OP 5 //W: Start the operation on the device

#define REG_MAX REG_DO_OP // Max reg count for continuous allocation

// Functions defined in portio 
u8 sb_status(void);
u8 sb_readval(void);
void sb_writeval(u8);
void sb_setopmode(u8);
void sb_setsecloc(u8);
void sb_setbyteloc(u8);
void sb_do_op(void);

// Transfer function stuff
void sb_write_byte(unsigned int, unsigned int, char, u8*);
u8 sb_read_byte(unsigned int, unsigned int, u8*);
 
// Debug macro stuff
#ifdef SB_DEBUG
#  ifdef __KERNEL__
    /* This one if debugging is on, and kernel space */
#    define PDEBUG(fmt, args...) printk( KERN_DEBUG "SimpleBlock: " fmt, ## args)
#  else
     /* This one for user space */
#    define PDEBUG(fmt, args...) fprintf(stderr, fmt, ## args)
#  endif
#else
#  define PDEBUG(fmt, args...) /* not debugging: nothing */
#endif

#endif
