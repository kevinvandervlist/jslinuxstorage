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
 * HTML5 Storage backend
 * Note: All caching mechanics are necessary because localStorage is 
 * _REALLY_ slow. 
 */

// Radix to convert strings <=> ints
Storage.prototype.RADIX = 16;

function HTML5Storage(count, size) {
	// Superclass constructor
	Storage.call(this, count, size);

	if(this.debug) {
		console.log("HTML5Storage backend enabled.");
	}
	
	// Clear the local disk
	// localStorage.clear();

	// Some buffers
	this.writebuffer = new StringBuilder();
	this.readbuffer = new StringBuilder();
	// Data in memory for faster reads.
	this.cache = new Array();
	
	// Check local data
	if(localStorage.getItem("jslinuxdisk") != "true") {
		// Create sector filler.
		for(var s = 0; s < this.sectorSize; s++) {
			this.writebuffer.append("00");
		}
		
		// No 'disk' found - create it now.
		console.log("Creating JS/Linux disk. This can take some time");
		localStorage.setItem("jslinuxdisk", true);
		for(var s = 0; s < this.sectorCount; s++) {
			if(s % 256 == 0) {
				console.log("Writing sector %d...", s);
			}
			localStorage.setItem("s"+s, this.writebuffer.toString());
		}
		this.writebuffer.clear();
		console.log("Done");
	}
	for(var s = 0; s < this.sectorCount; s++) {
		if(s % 256 == 0) {
			console.log("Caching sector %d...", s);
		}
		this.cache[s] = new Uint8Array(this.sectorSize);
		var lsc = localStorage["s"+s];
		for(var b = 0; b < this.sectorSize; b++) {
			this.readbuffer.clear();
			this.readbuffer.append(lsc[b*2]);
			this.readbuffer.append(lsc[b*2+1]);
			this.cache[s][b] = parseInt(this.readbuffer.toString(), this.RADIX);
		}
	}
}

// Subclass prototype that inherits superclass prototype.
// See: JavaScript : the definitive guide, O'Reilly, page 168
function heir(p) {
	function f() {}
	f.prototype = p;
	return new f();
}
HTML5Storage.prototype = heir(Storage.prototype);

// Set the constructor in the prototype.
HTML5Storage.prototype.constructor = HTML5Storage;

/**
 * Read a certain byte from the storage backend.
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 */

HTML5Storage.prototype.getByte = function(sector, byte) {
	return this.cache[sector][byte];	
}

/**
 * Write a certain byte to the storage backend.
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 * Value: The value to store.
 */

HTML5Storage.prototype.setByte = function(sector, byte, value) {
	// Store in cache
	this.cache[sector][byte] = value;
	// Append to writebuffer.
	this.writebuffer.append(this.dec2hex(value, 2));

	// Flush writebuffer?
	if(byte == (this.sectorSize - 1)) {
		localStorage.setItem("s"+sector, this.writebuffer.toString());
		this.writebuffer.clear();
	}
}

// Initializes a new instance of the StringBuilder class
// and appends the given value if supplied
// http://www.codeproject.com/KB/scripting/stringbuilder.aspx
function StringBuilder(value) {
    this.strings = new Array("");
    this.append(value);
}
// Appends the given value to the end of this instance.
StringBuilder.prototype.append = function (value) {
    if (value) {
        this.strings.push(value);
    }
}
// Clears the string buffer
StringBuilder.prototype.clear = function () {
    this.strings.length = 1;
}
// Converts this instance to a String.
StringBuilder.prototype.toString = function () {
    return this.strings.join("");
}
