$(document).ready(function() { 
    paper.install(window);
    paper.setup("myCanvas");
    'use strict';

    const defaultWidth = 100;
    const defaultHeight = 30;
    const expanderRadius = 8;
    const spaceV=12;
    const spaceH=38;
    const margins={left: 10, right: 10, top:8, bottom: 8};
    const branchColors = ['red', 'green', 'blue', 'teal', 'darkviolet', 'firebrick', 'forestgreen', 'gold', 'tomato', 'lightseagreen'];
    const backgroundColors = ['white', '#282923'];
    const textColors = ['black', 'white'];
    const itemColors = ['whitesmoke', 'black'];
    var themeId = 1;
    var idCounter = 0;
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext("2d");
    var branchColorNum = -1;
    var isNaN = function(x,y) {
        if (x !== x) 
            return y
        else
            return x; 
    };

    function newId(){
        idCounter += 1;
        return idCounter;
    }
    //------------функции измерения
    function getTextWidth(text, font) {
        // let cvs = document.getElementById('myCanvas');
        // let ctx = cvs.getContext("2d");
        let sText = text;
        ctx.font = font;
        let metrics = ctx.measureText(sText);
        return metrics.width;
    }
    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
    function init()
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    //------------------------------
    class Tree {
        constructor(){
            let _items = new Map();
            this.items = _items;
            this._offset = {x:0, y:0};
            this.root =  new Item(this, 0, "CENTRAL TOPIC");
            this._focused = this.root;
            this.background = new Path.Rectangle(new Rectangle(new Point(0,0), new Size(canvas.width,canvas.height)));
            this.background.fillColor = backgroundColors[themeId]; 
            let _self = this;
            let doMouseDrag = function(event) {
                _self._offset.x = _self._offset.x + event.delta.x;
                _self._offset.y = _self._offset.y + event.delta.y; 
                for (let itm of _self.items.values()) _self.paint(itm);
            }
            this.background.onMouseDrag = doMouseDrag;
            return this;
        }
        get offset() {
            return this._offset;
        }
        set ofsset(value) {
            this._offset = value;
            for (let itm of items.values()) {
                this.paint(itm);
            }
        }
        get focused(){
            return this._focused;
        }
        set focused(value) {
            if (this._focused !== value) {
                this._focused = value;
                this.recalc();
            }
        }
        find(id){
            return this.items.get(id);
        }
        getChildCount(id) {
            let count = 0;
            for (let itm of this.items.values()) {
                if (itm.pid === id)
                    count += 1;
            }
            return count;
        }
        append(pid, text){
            let itm =  new Item(this, pid, text);
            this.recalc();
            return itm;
        }
        prev(item){
            let old;
            for (let itm of this.items.values()) {
                if (itm.pid === item.pid) {
                    if (itm.id === item.id) 
                        return old
                    else 
                        old = itm;
                    
                }
            }
        }
        next(item){
            let curFounded = false;
            let founded;
            for (let itm of this.items.values()) {
                if ((itm.id === item.id) & (curFounded === false)) {
                    curFounded = true;
                } else {
                    if ((itm.pid === item.pid) & (curFounded === true)) {
                        founded = itm;
                        break; 
                    }
                }
            }
            return founded;
        }
        firstChild(item) {
            for (let itm of this.items.values()) {
                if (itm.pid === item.id) {
                    return itm;
                }
            }
        }
        getOuterHeight(id){
            let outerHeight = 0;
            if (this.hasChild(id)) {
                for (let child of this.items.values()) {
                    if (child.pid === id) outerHeight += this.getOuterHeight(child.id);
                }
                if (outerHeight === 0) { 
                    let itm = this.find(id);
                    outerHeight = itm.height + spaceV;
                }
            } 
            else {
                let itm = this.find(id);
                outerHeight = itm.height + spaceV;
            } 
            return outerHeight;
        }
        getRegardTop(id){
            let regtop = 0;
            let par = this.getParent(id);
            for (let itm of this.items.values()) {
                if (itm.pid === par.id) {
                    if (itm.id === id) break;
                    regtop += itm.outerHeight;
                }
            }
            return regtop;
        }
        getOuterTop(id){
            let pid = this.getPid(id);
            let parOutTop = 0;
            let regTop = 0;
            if (pid !== 0) {
                parOutTop = this.getOuterTop(pid);
                regTop = this.getRegardTop(id);
            }
            return parOutTop + regTop;
        }
        hasChild(id){
            let founded = false;    
            for (let itm of this.items.values()) 
                if (itm.pid === id) { 
                    founded = true;
                    break; 
            }
            return founded;
        }
        getPid(id){
            if  (id > 0) {
                let itm = this.find(id);
                return itm.pid;
            }
        }
        getParent(id) {
            let pid = this.getPid(id);
            return this.find(pid);
        }
        calc(id) {
            let cur = this.find(id);
            let parRight = 0;
            if (cur) {
                let par = this.find(cur.pid);
                if (typeof par !== 'undefined')
                    parRight = par.right;
            
                cur._x = parRight + spaceH;
                cur._y = cur.outerTop + ((cur.outerHeight + cur.height)/2);
                this.paint(cur);
                if (this.hasChild(id)) {
                    for (let child of this.items.values()) {
                        if (child.pid === id) {
                            this.calc(child.id);
                        } 
                    }
                }
            }
        }
        editText(itm) {
            let txt = prompt('Введите текст', itm.text);
            if (txt != null)
                itm.text = txt;
        }
        remove(itm){ 
            if (itm !== this.root) {
                while (this.hasChild(itm.id)) {
                    this.remove(this.firstChild(itm));
                }
                itm.line.remove();
                itm.branch.remove();
                itm.textItem.remove();
                itm.rect.remove();
                itm.expander.remove();
                itm.expanderText.remove();
                this.items.delete(itm.id);
            }
        }
        recalc(){
            if (this.root) {
                this.calc(this.root.id);
            }
        }
        refresh(){
            this.recalc();
            for (let itm of this.items.values()) 
                this.paint(itm);
        }
        paint(itm){
            let self = this;
            let par = itm.parent;
            let itemExpanded = itm.parentExpanded;

            if (itemExpanded) {
                //line
                let firstSegment = new Segment({
                    point: [this.offset.x + itm.x,this.offset.y + itm.y]
                });
                let secondSegment = new Segment({
                    point: [this.offset.x + itm.right,this.offset.y + itm.y]
                }); 
                itm.line.segments = [firstSegment, secondSegment]; 

                //branch    
                if (typeof par !== 'undefined') {
                    let startPoint = new Point(this.offset.x + itm.x, this.offset.y+itm.y);
                    let endPoint = new Point(this.offset.x + par.right+(expanderRadius*2), this.offset.y + par.y);

                    let rc = new Rectangle(startPoint, endPoint);
                    let c = rc.center;
                    let h1 = new Point(c.x, this.offset.y+itm.y); 
                    let h2 = new Point(c.x, this.offset.y+par.y);
                    if (itm.branch) itm.branch.remove();
                    itm.branch = new Path();
                    itm.branch.add(startPoint);
                    itm.branch.cubicCurveTo(h1,h2, endPoint);
                    itm.branch.strokeColor = itm.branchColor;
                    itm.branch.strokeWidth = 1;
                }
                //text
                itm.textItem.fillColor = textColors[themeId];
                itm.textItem.point = [this.offset.x+ itm.x+margins.left , this.offset.y + itm.y-margins.bottom-itm.line.strokeWidth-1];
                itm.textItem.onClick = function(event) {
                    self.focused = itm;
                }
                itm.textItem.onDoubleClick = function(event) {
                    self.editText(itm);
                }

                //rect
                let bkRect = new Rectangle(new Point(this.offset.x+ itm.x, this.offset.y+itm.top), new Size(itm.width, itm.height-itm.line.strokeWidth-1));
                let corner = new Size(3,3);
                itm.rect.remove();
                itm.rect = new Path.Rectangle(bkRect, corner);
                itm.rect.fillColor = itemColors[themeId];
                itm.rect.onClick = function(event) {
                    self.focused = itm;
                }
                itm.rect.onDoubleClick = function(event) {
                    self.editText(itm);
                }
                if (itm.id === this.focused.id) {
                    itm.rect.strokeColor = 'red';
                    itm.rect.strokeWidth = 1;            
                }

                itm.line.bringToFront();
                itm.textItem.bringToFront();
                //expander
                if (itm.expander) {
                    itm.expander.remove();
                    itm.expander = new Path.Circle(new Point(this.offset.x+itm.right+expanderRadius,this.offset.y + itm.y), expanderRadius);
                    itm.expander.strokeColor = itm.branchColor;
                    itm.expander.fillColor = 'white';
                    itm.expander.strokeWidth = 1;
                    itm.expander.onClick = function(event) {
                        if (itm.expanderText.content !== '+') {
                            if (itm.pid !== 0) itm.expanded = !itm.expanded
                        } else { 
                            self.append(itm.id, 'New Item');
                        }
                    }
                }
                let childCount = this.getChildCount(itm.id);
                if (childCount === 0) 
                    itm.expanderText.content = '+'
                else
                    itm.expanderText.content = childCount;
                itm.expanderText.point = [this.offset.x+ itm.right+5, this.offset.y + itm.y+4];
                itm.expanderText.onClick = function(event) {
                    if (itm.expanderText.content !== '+') {
                        if (itm.pid !== 0) itm.expanded = !itm.expanded
                    } else { 
                        self.append(itm.id, 'New Item');
                    }
                }
                itm.expanderText.bringToFront();
            }
            itm.visible = itm.parentExpanded;
            view.draw();   
        }
    }
    class Item{
        constructor(tree, pid, text) {
            //генерим идентификатор
            this.id = newId();
            //дерево
            let _tree = tree;
            this.tree = _tree;
            tree.items.set(this.id, this);
            //родитель
            let _pid = pid;
            this._pid = _pid;
            this.pid = this._pid; 
            //инициализация начальной точки

            this._expanded = true;

            this._height = defaultHeight;
            this._width = defaultWidth;
            //текст
            this.textItem = new PointText({
                content: "",
                fillColor: 'black',
                fontFamily: "Calibri",
                fontWeight: "italic",
                fontSize: 16,
            });

            let _x = 0;
            let _y = this._height; 
            this._x = _x;
            this._y = _y;
            let _branchColor = 'blue';
            if ((this.pid !== 0) & (this.parent === tree.root)) {
                branchColorNum += 1;  
                _branchColor = branchColors[branchColorNum % branchColors.length];
            } else {
                if (this.pid === 0) 
                    _branchColor = 'black'
                else    
                    _branchColor = this.parent.branchColor;          
            }

            this.branchColor = _branchColor; 
            this.line = new Path({strokeColor: this.branchColor, strokeWidth: 2});
            this.branch = new Path({strokeColor: this.branchColor, strokeWidth: 1});
            this.rect = new Path({fillColor: 'whitesmoke'});
            this.expander = new Path.Circle(new Point(this.right, this.y), 8);
            this.expanderText = new PointText({
                content: "0",
                fillColor: 'black',
                fontFamily: "Calibri",
                fontWeight: "",
                fontSize: 12,
            });

            this.textItem.bringToFront;
            this.text = text;
 

            this._visible = true;
            return this;
        }
        get parent(){
            return this.tree.find(this.pid);
        }
        get visible() {
            return this._visible;
        }
        get parentExpanded(){
            if (this.pid !== 0) {
                let par = this.parent;
                if (par.expanded)
                    return par.parentExpanded
                else
                    return false;
            } else {
                return true;
            }
        }
        get expanded() {
            return this._expanded;
        }
        get x() {
            return this._x;
        }
        get y(){
            return this._y;
        }
        get width(){
            if (this.parentExpanded) 
                return this._width
            else
                return 0;
        }
        get right() {
            return this.x + this.width;
        }
        get height(){
            if (this.parentExpanded) 
                return this._height
            else
                return 0;
        }
        get top() {
            return this.y-this.height;
        }
        get outerHeight(){
            return this.tree.getOuterHeight(this.id);
        }
        get regardTop() {
            return this.tree.getRegardTop(this.id);
        }
        get outerTop() {
            return this.tree.getOuterTop(this.id);
        }
        get outerBottom() {
            return this.outerTop + this.outerHeight;
        }
        get text() {
            return this.textItem.content;
        }
        set x(value){
            if (this._x !== value) {
                this._x = value;
                this.tree.recalc();
            }
        }
        set y(value){
            if (this._x !== value) {
                this._y = value;
                this.tree.recalc();
            }
        }
        set width(value) {
            if (this._width !== value) {
                this._width = value;
                this.tree.recalc();
            }
        }
        set height(value){
            if (this._height !== value) {
                this._height = value;
                this.tree.recalc();
            }
        }
        set text(value){
            if (this.textItem.content !== value) {
                this.textItem.content = value;
                let tw = getTextWidth(this.textItem.content, `${this.textItem.fontSize}px ${this.textItem.fontFamily} ${this.textItem.fontWeight}`);
                this.width = margins.left + tw + margins.right;
                this.tree.recalc();
            }
        }
        set expanded(value) {
            if (this._expanded !== value) {
                this._expanded = value;
                this.tree.recalc();
            } 
        }
        set visible(value) {
            if (this._visible !== value) {
                this._visible = value;

                this.line.visible = value;
                this.branch.visible = value;
                this.rect.visible = value;
                this.textItem.visible = value;
                if (this.expander)
                    this.expander.visible = value;
                this.expanderText.visible = value; 
                this.tree.recalc();            
            }
        }
    }


    paper.project.clear();
    init();
    let tree = new Tree();
    let tool = new Tool;
    tool.onKeyDown  = function(event) {
        let itm = tree.focused;
        switch(event.key) {
            case 'left':
                itm = tree.focused.parent;
                break;
            case 'right':
                itm = tree.firstChild(itm);
                break;
            case 'up':
                itm = tree.prev(itm);
                break;
            case 'down':
                itm = tree.next(itm);
                break;
            case 'f2':
                tree.editText(itm);
                break;
            case 'tab': 
                itm = tree.append(tree.focused.id, "Новый топик");
                break;
            case 'enter':
                if (itm.pid !== 0) 
                    itm = tree.append(tree.focused.pid, "Новый топик");
                break;
            case 'delete':
                let par = itm.parent;
                tree.remove(itm);
                itm = par;
                tree.refresh();
                view.draw();
                break;
        }
        if (typeof itm !== 'undefined') tree.focused = itm;
    }    

    let item1 = tree.append(tree.root.id, "Chapter 1");
    let item2 = tree.append(tree.root.id, "Chapter 2");
    let item3 = tree.append(tree.root.id, "Chapter 3");
    let item4 = tree.append(item1.id, "Item 1-1");
    let item5 = tree.append(item1.id, "Item 1-2");
    let item6 = tree.append(item2.id, "Item 2-1");
    let item7 = tree.append(item2.id, "Item 2-2");
    let item8 = tree.append(item2.id, "Item 2-3");
    let item9 = tree.append(item7.id, "Item 2-2-1");    
    let item10 = tree.append(item7.id, "Item 2-2-2");
    let item11 = tree.append(item7.id, "Item 2-2-3");
    item2.text = 'Это вторая глава книги Пески времени';
    item6.text = '1';
    view.draw();
});