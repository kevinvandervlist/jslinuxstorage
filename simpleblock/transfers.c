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

#include <linux/types.h>

#include "simpleblock.h"

void sb_write_byte(unsigned int sector, unsigned int byte, char val, u8 *status) {
  u8 b = 0xff;
  // First we have to verify if the device is available (status == 0x00)
  if(sb_status() != 0x00) {
	// Not ready for transfering
	PDEBUG("sb_write_byte status(): %02x", sb_status());
	*status = 0xff;
	return;
  }

  // Set the operation mode
  sb_setopmode(b);

  // Set location information. Two bytes:
  b = (sector & 0xff00) >> 8;
  sb_setsecloc(b);
  b = (sector & 0xff);
  sb_setsecloc(b);

  // Do the same for a byte:
  b = (byte & 0xff00) >> 8;
  sb_setbyteloc(b);
  b = (byte & 0xff);
  sb_setbyteloc(b);

  // Now set the byte to transfer
  sb_writeval(val);

  // And finally start the operation
  sb_do_op();
  
  return;
}


u8 sb_read_byte(unsigned int sector, unsigned int byte, u8 *status) {
  u8 b = 0x00;
  // First we have to verify if the device is available (status == 0x00)
  if(sb_status() != 0x00) {
	// Not ready for transfering
	PDEBUG("sb_read_byte status(): %02x", sb_status());
	*status = 0xff;
	return 0xff;
  }

  // Set the operation mode
  sb_setopmode(b);

  // Set location information. Two bytes:
  b = (sector & 0xff00) >> 8;
  sb_setsecloc(b);
  b = (sector & 0xff);
  sb_setsecloc(b);

  // Do the same for a byte:
  b = (byte & 0xff00) >> 8;
  sb_setbyteloc(b);
  b = (byte & 0xff);
  sb_setbyteloc(b);

  // Do the operation 
  sb_do_op();

  // And finally start the operation
  return sb_readval();
}
