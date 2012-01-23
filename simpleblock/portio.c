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
#include <linux/io.h>

#include "simpleblock.h"

/**
 * Read the status register. 
 * Return it's status as a u8 byte.
 */

inline u8 sb_status(void) {
  u8 val = inb(REG_BASE + REG_STATUS);
  PDEBUG("sb_status: %x", val);  
  return val;
}

/**
 * Read the value register. 
 * Return it's value as a u8 byte.
 */

inline u8 sb_readval(void) {
  u8 val = inb(REG_BASE + REG_VAL);
  PDEBUG("sb_readval: %x", val);  
  return val;
}

/**
 * Write the value register.
 * Write as a u8 byte.
 */

inline void sb_writeval(u8 byte) {
  outb(byte, REG_BASE + REG_VAL);
  PDEBUG("sb_writeval: %x", byte);  
}

/**
 * Set the operation mode.
 * Write as a u8 byte.
 */

inline void sb_setopmode(u8 byte) {
  outb(byte, REG_BASE + REG_OPMODE);
  PDEBUG("sb_setopmode: %x", byte);  
}

/**
 * Set the secloc register.
 * FIFO register. First part is high end, second part is low.
 * Write as a u8 byte.
 */

inline void sb_setsecloc(u8 byte) {
  outb(byte, REG_BASE + REG_SECLOC);
  PDEBUG("sb_setsecloc: %x", byte);  
}

/**
 * Set the secbyte register.
 * FIFO register. First part is high end, second part is low.
 * Write as a u8 byte.
 */

inline void sb_setbyteloc(u8 byte) {
  outb(byte, REG_BASE + REG_BYTELOC);
  PDEBUG("sb_setbyteloc: %x", byte);  
}

/**
 * Start the operation mode.
 * The device will set the status to available when 
 * it's finished.
 */

inline void sb_do_op(void) {
  outb(0xff, REG_BASE + REG_DO_OP);
  PDEBUG("sb_do_op: %x", 0xff);  
}
