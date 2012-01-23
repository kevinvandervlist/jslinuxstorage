/**
 * Persistent storage for JS/Linux.
 * This class does some caching, and allows disks to be stored / read.
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

function DiskCache(count, size) {
	this.sectorCount = count;
	this.sectorSize = size;
	try {
		this.storage = new Uint8Array(count * size);
	} catch(e) {
		this.storage = new Array(count * size);
	}
}

/**
 * Read a certain byte from the disk cache
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 */

DiskCache.prototype.clearDisk = function() {
	try {
		this.storage = new Uint8Array(this.sectorCount * this.sectorSize);
	} catch(e) {
		this.storage = new Array(this.sectorCount * this.sectorSize);
	}
}


/**
 * Read a certain byte from the disk cache
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 */

DiskCache.prototype.getByte = function(sector, byte) {
	return this.storage[(sector * this.sectorSize) + byte];
}

/**
 * Write a certain byte to the disk cache
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 * Value: The value to store.
 */

DiskCache.prototype.setByte = function(sector, byte, value) {	
	this.storage[(sector * this.sectorSize) + byte] = value;
}

/**
 * Return an url to 'the download location' of this disk.
 */

DiskCache.prototype.getDownloadLocation = function() {	
    return location.href = 'data:application/octet-stream;base64,' + this.getDownloadData();
}

/**
 * Prepare the data for a download.
 */

DiskCache.prototype.getDownloadData = function() {
    var i = this.storage.length;
    var bstr = new Array(i);
    while (i--) {
      bstr[i] = String.fromCharCode(this.storage[i]);
    }
	// Perhaps not the right place to refer to window, but it will have to do
    return window.btoa(bstr.join(''));
}

/**
 * Load a saved disk to memory.
 * File: The File object received from <input>
 */

DiskCache.prototype.loadData = function(file) {	
    var reader = new FileReader();

	// Make sure the callback can reference the DiskCache
	reader.cache = this;

    reader.onload = function(e) {
		var a;
		if(this.result == null) {
			alert("Restoring the image only works in new Firefox versions now.");
			console.log("Restoring the image only works in new Firefox versions now.");
			return;
		}
		// The new disk cache
		try {
			var img = new Uint8Array(this.result);
		} catch(e) {
			var img = new Array(this.result);
		}

		if(img.length == this.cache.storage.length) {
			this.cache.storage = img;
			this.cache.flush();
			console.log("Restored filesystem image!");
		} else {
			console.error("File system images aren't the same size");
		}
    };

	reader.readAsArrayBuffer(file);
}

/**
 * Flush the disk
 * This is normally empty, because it is a cache. 
 * It can be overridden by a persistent provider though.
 */

DiskCache.prototype.flush = function() {	
	return;
}
