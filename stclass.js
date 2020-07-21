'use strict'

var idCounter = -1;

function newId() {
    idCounter += 1;
    return idCounter;
}
class Tree {
    constructor() {
        let _items = new Map();
        this.items = _items;
        let root = this.append(-1, 'root');
        this.root = root;
        this._focused = this.root.id;
        this.focused = this._focused
    }
    find(id) {
        return this.items.get(id);
    }
    get focused() {
        return this._focused;
    }
    set focused(value) {
        if (this._focused !== value) {
            let onLostFocusEvent = new CustomEvent('onlostfocus', { detail: { item: this.focused } });
            dispatchEvent(onLostFocusEvent);
            this._focused = value;
            let onFocused = new CustomEvent('onfocused', { detail: { item: this.focused } });
            dispatchEvent(onFocused);
        }
    }
    append(pid, text) {
        let itm = new Item(this, pid, text);
        let event = new CustomEvent('onitemadded', { detail: { item: itm } });
        dispatchEvent(event);
        this.focused = itm.id;
        return itm;
    }
    remove(id) {
        let itm = this.find(id);
        if (!itm) throw ('Неверный ID');
        while (this.hasChild())
            this.remove(this.firstChild(itm).id);
        this.items.delete(id);
    }
    _prev(item) {
        let num = item.index;
        let pid = item.pid;
        let founded = -2;
        for (let itm of this.items.values()) {
            if ((itm.pid === pid) & (itm.index >= num - 2) & (itm.index < num)) {
                founded = itm.id;
            }
        }
        return this.find(founded);
    }
    _next(item) {
        let num = item.index;
        let pid = item.pid;
        let founded = -2;
        for (let itm of this.items.values()) {
            if ((itm.pid === pid) & (itm.index > num) & (itm.index <= num + 2)) {
                founded = itm.id;
            }
        }
        return this.find(founded);
    }
    firstChild(parent) {
        let res;
        for (let itm of this.items.values()) {
            if ((itm.pid === parent.id) & (itm.index <= 2)) {
                res = itm;
                break;
            }
        }
        return res;
    }
    lastChild(parent) {
        let maxSortNum = 0;
        let last;
        for (let itm of this.items.values()) {
            if ((itm.id === parent.id) & (itm.index > maxSortNum)) {
                maxSortNum = itm.index;
                last = itm;
            }
        }
        return last;
    }
    getTree(parent) {
        let arr = [];
        if (parent.hasChild()) {
            let itm = this.firstChild(parent);
            do {
                let obj = {
                    id: itm.id,
                    pid: itm.pid,
                    text: itm.text,
                    expanded: itm.expanded,
                    index: itm.index,
                    childs: this.getTree(itm)
                }
                arr.push(obj);
                itm = itm.next();
                if (!itm) break;
            } while (!itm.isLast());
        }
        return arr;
    }
    asString() {
        let items = this.getTree(this.root);
        let str = JSON.stringify(items);
        return str;
    }
}

class Item {
    constructor(tree, pid, text = 'New Item', afterIdx = -1) {
        this.id = newId();
        tree.items.set(this.id, this);
        this._pid = pid;
        this.pid = this._pid;
        this._text = text;
        this.text = this._text;
        this._tree = tree;
        this.index = afterIdx + 1;
        this._recalcChildSortNum();
        this._expanded = false;
        this.expanded = this._expanded;
        this._selected = false;
        this.selected = this._selected;
    }
    get pid() {
        return this._pid;
    }
    set pid(value) {
        if (this._pid !== value) {
            let event = new CustomEvent('onchangepid', {
                detail: {
                    oldPid: this._pid,
                    newPid: value
                }
            });
            if (!this.isChildren(value)) {
                this._pid = value;
                this._recalcChildSortNum();
                dispatchEvent(event);
            }
        }
    }
    get expanded() {
        return this._expanded;
    }
    set expanded(value) {
        this._expanded = value;
        let event = new CustomEvent('onitemexpanded', { detail: { id: this.id } });
        dispatchEvent(event);
    }
    get selected() {
        return this._selected;
    }
    set selected(value) {
        if (this._selected !== value) {
            this._selected = value;
            let event = new CustomEvent('onitemselected', { detail: { id: this.id, selected: value } });
            dispatchEvent(event);
        }
    }
    addChild(text) {
        return this._tree.append(this.id, text);
    }
    hasChild() {
        let founded = false;
        for (let itm of this._tree.items.values())
            if (itm.pid === this.id) {
                founded = true;
                break;
            }
        return founded;
    }
    parent() {
        return this._tree.find(this.pid);
    }
    isChildren(id) {
        let itm = this._tree.find(id);
        if (!itm)
            return false
        else {
            let par = this._tree.find(itm.pid);
            if (!par)
                return false
            else if (par.id === id)
                return true
            else if (par.pid !== 0)
                return this.isChildren(this.pid)
            else
                return false
        }
    }
    parentIsExpanded() {
        if (this.pid !== 0) {
            let par = this.parent();
            if (par) {
                if (par.expanded)
                    return par.parentIsExpanded
                else
                    return false;
            } else
                return true;
        } else
            return true;
    }
    isLast() {
        let founded = 0;
        let pid_ = this.pid;
        let maxNum = 0;

        for (let itm of this._tree.items.values()) {
            if ((itm.pid === pid_) & (itm.index > maxNum)) {
                maxNum = itm.index;
                founded = itm.id;
            }
        }
        return founded === this.id;
    }
    getChildCount() {
        let count = 0;
        for (let itm of this.items.values()) {
            if (itm.pid === this.id)
                count += 1;
        }
        return count;
    }
    prev() {
        return this._tree._prev(this);
    }
    next() {
        return this._tree._next(this);
    }
    _recalcChildSortNum() {
        let parent = this.parent();
        if (parent) {
            let itm = this._tree.firstChild(parent);
            let num = 0;
            do {
                num += 2;
                itm.index = num;
                itm = itm.next();
                if (!itm) break;
            } while (!itm.isLast());
        }
    }
    moveTo(pid, after = 0) {
        let src = this.parent;
        let dst = this._tree.find(pid);
        this.pid = pid;
        if (src !== dst)
            src._recalcChildSortNum();
        this.index = after;
        dst._recalcChildSortNum();
    }
}

class Join {

}