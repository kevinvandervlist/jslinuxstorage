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
 * Dead slow because of the localstorage interface
 * It can't even fit in localstorage
 */

// Wordsize in bytes.
Storage.prototype.WORDSIZE = 4;
// Radix to convert strings <=> ints
Storage.prototype.RADIX = 16;

function HTML5StorageWords(count, size) {
	// Superclass constructor
	Storage.call(this, count, size);

	if(this.debug) {
		console.log("HTML5StorageWords backend enabled.");
	}
	localStorage.clear();
	
	// Check local data
	if(localStorage.getItem("jslinuxdisk") == "true") {
		// 'Disk' found - initialize it.
		console.log("JS/Linux disk found!");
	} else {
		// No 'disk' found - create it now.
		console.log("Creating JS/Linux disk. This can take some time...");
		localStorage.setItem("jslinuxdisk", true);
		for(var s = 0; s < this.sectorCount; s++) {
			if(s % 256 == 0) {
				console.log("Writing sector %d", s);
			}
			for(var w = 0; w < this.sectorSize; w+=4) {
				localStorage.setItem(this.getWordKey(s, w), "00000000");
			}
		}
		console.log("Done");
	}
}

// Subclass prototype that inherits superclass prototype.
// See: JavaScript : the definitive guide, O'Reilly, page 168
function heir(p) {
	function f() {}
	f.prototype = p;
	return new f();
}
HTML5StorageWords.prototype = heir(Storage.prototype);

// Set the constructor in the prototype.
HTML5StorageWords.prototype.constructor = HTML5StorageWords;

/**
 * Read a certain byte from the storage backend.
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 */

HTML5StorageWords.prototype.getByte = function(sector, byte) {
	// First, make sure we retrieve the correct 32bit word
	var pos = byte % this.WORDSIZE;

	if(this.debug) {
		console.log("Retrieving d,sector,word => %s", this.getWordKey(sector, byte));
	}

	// Retrieve the raw word
	var word = localStorage.getItem(this.getWordKey(sector, byte));

	// And return the byte
	return this.getByteFromWord(word, pos);
}

/**
 * Write a certain byte to the storage backend.
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 * Value: The value to store.
 */

HTML5StorageWords.prototype.setByte = function(sector, byte, value) {	
	// First, make sure we retrieve the correct 32bit word
	var pos = byte % this.WORDSIZE;

	if(this.debug) {
		console.log("Writing d,sector,word:val => %s:0x%s", this.getWordKey(sector, byte), this.dec2hex(value, 2));
	}

	var wordkey = this.getWordKey(sector, byte);

	// Retrieve the current raw word.
	var word = localStorage.getItem(wordkey);
	
	// Set the new value in the correct location
	localStorage.setItem(wordkey, this.storeByteInWord(word, pos, value));
}

/**
 * Retrieve the correct key representing the requested byte
 * Sector: The sector location of the requested byte.
 * Byte: The requested byte location on a certain sector.
 */

HTML5StorageWords.prototype.getWordKey = function(sector, byte) {
	if(byte == 0) {
		return "d,"+sector+",0";
	} else {
		return "d,"+sector+","+Math.floor(byte/this.WORDSIZE);
	}
}

/**
 * Retrieve the requested byte from a word.
 * Word: The raw word.
 * Pos: Which word to retrieve
 */

HTML5StorageWords.prototype.getByteFromWord = function(word, pos) {
	var ret = 0x00;

	switch(pos) {
	case 1:
		ret = (parseInt(word, this.RADIX) & 0x000000ff);
		break;
	case 2:
		ret = (parseInt(word, this.RADIX) & 0x0000ff00) >> 8;
		break;
	case 3:
		ret = (parseInt(word, this.RADIX) & 0x00ff0000) >> 16;
		break;
	case 4:
		ret = (parseInt(word, this.RADIX) & 0xff000000) >> 24;
		break;
	default:
		break;
	}
	return ret;
}

/**
 * Store given byte in a word.
 * Word: The raw word.
 * Pos: Which word to retrieve
 * Byte: The byte to store
 */

HTML5StorageWords.prototype.storeByteInWord = function(word, pos, byte) {
	var ret;
	switch(pos) {
	case 1:
		ret = (parseInt(word, this.RADIX) & ~0x000000ff) | byte;
		break;
	case 2:
		ret = (parseInt(word, this.RADIX) & ~0x0000ff00) | byte << 8;
		break;
	case 3:
		ret = (parseInt(word, this.RADIX) & ~0x00ff0000) | byte << 16;
		break;
	case 4:
		ret = (parseInt(word, this.RADIX) & ~0xff000000) | byte << 24;
		break;
	default:
		break;
	}
	return this.dec2hex(ret, 2);
}

