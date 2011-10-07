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
 * Extension template.
 * At a minimum, use this.
 * Also make sure to override {g,s}etByte()
 */

function Template(count, size) {
	// Superclass constructor
	Storage.call(this, count, size);
}

// Subclass prototype that inherits superclass prototype.
// See: JavaScript : the definitive guide, O'Reilly, page 168
function heir(p) {
	function f() {}
	f.prototype = p;
	return new f();
}
Template.prototype = heir(Storage.prototype);

// Set the constructor in the prototype.
Template.prototype.constructor = Template;