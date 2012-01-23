/**
 * Persistent storage for JS/Linux.
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
 * JavaScript storage backend for block devices
 */

/**
 * Memory Storage providing backend.
 * Count: Number of sectors
 * Size: Size of a sector
 */

function MemStorage (count, size) {
	// Superclass constructor
	Storage.call(this, count, size);

	// Initialize storage
	this.storage = new DiskStorage(this.sectorCount, this.sectorSize);

	// Set the memorytype
	this.memtype = Storage.prototype.type.MEMORY;
}

// Subclass prototype that inherits superclass prototype.
// See: JavaScript : the definitive guide, O'Reilly, page 168
function heir(p) {
	function f() {}
	f.prototype = p;
	return new f();
}
MemStorage.prototype = heir(Storage.prototype);

// Set the constructor in the prototype.
MemStorage.prototype.constructor = MemStorage;

/**
 * Return a download link to the current filesystem image.
 */

Storage.prototype.getDownloadLink = function() {
	return "<a href=\"" + this.storage.getDownloadLocation() + "\">Download disk image</a>";
	;
}

/**
 * Load a saved disk to memory.
 * File: The File object received from <input>
 */

MemStorage.prototype.loadData = function(file) {	
	this.storage(file);
}

/**
 * Read a certain byte from the storage backend.
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 */

MemStorage.prototype.getByte = function(sector, byte) {
	return this.storage.getByte(sector, byte);
}

/**
 * Write a certain byte to the storage backend.
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 * Value: The value to store.
 */

MemStorage.prototype.setByte = function(sector, byte, value) {	
	this.storage.setByte(sector, byte, value);
}

/**
 * Clear (cached) disk
  */

MemStorage.prototype.clearDisk = function() {	
	this.storage.clearDisk();
}