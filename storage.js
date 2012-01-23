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

Storage.prototype.debug = false;

// Storage types
Storage.prototype.type = {
	HTML5STORAGE: 0x00,
	HTML5STORAGEWORDS: 0x01,
	MEMORY: 0xff
};

/**
 * Storage class providing specific subclasses
 * Count: Number of sectors
 * Size: Size of a sector
 */

function Storage (count, size) {
	this.sectorCount = count;
	this.sectorSize = size;

	if(this.debug) {
		console.log("Initialising storage backend. Geometry: %d sectors of %d bytes makes %d bytes.", count, size, count * size);
	}
}

/**
 * Initialize the memory backend.
 * Count: Number of sectors
 * Size: Size of a sector
 * Type: The type of storage backend
 */

Storage.prototype.getStorageBackend = function(count, size, type) {
	var stor;

	// Check for localstorage support.
	function localStorage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	}

    switch (type) {
    case this.type.HTML5STORAGE:
		if(localStorage()) {
			stor = new HTML5Storage(count, size);
		} else {
			console.error("Can't initialize local storage.");
			return null;
		}
        break;
    case this.type.HTML5STORAGEWORDS:
		if(localStorage()) {
			stor = new HTML5StorageWords(count, size);
		} else {
			console.error("Can't initialize local storage with words.");
			return null;
		} 
		break;
    case this.type.MEMORY:
		// Default choice: fall-through
    default:
		stor = new MemStorage(count, size);
        break;
    }

	// Check if we are set up correctly
	if(stor == null) {
		console.error("Falling back on memory storage.");

		stor = new MemStorage(count, size);

		throw new Error("Non-persistent memory backend implicitly chosen.");
	}

	return stor;
}

/**
 * Read a certain byte from the storage backend.
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 */


Storage.prototype.getByte = function(sector, byte) {
	return null;
}

/**
 * Write a certain byte to the storage backend.
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 * Value: The value to store.
 */


Storage.prototype.setByte = function(sector, byte, value) {
	return;
}

/**
 * Return a download link to the current filesystem image.
 */

Storage.prototype.getDownloadLink = function() {
	return;
}

/**
 * Load a saved disk to memory.
 * File: The File object received from <input>
 */

Storage.prototype.loadData = function(file) {	
}

/**
 * Clear disk data
 */

Storage.prototype.clearDisk = function() {
}

/**
 * Print a human readable (i.e. consistent padding) hexadecimal digit.
 * d: The digit to print.
 * padding: The amount of padding.
 */

Storage.prototype.dec2hex = function (d, padding) {
	var hex = Number(d).toString(16);
	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return hex;
}
