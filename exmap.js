$(document).ready(function() { 
    paper.install(window);
    paper.setup("myCanvas");
    'use strict';

    const defaultWidth = 100;
    const defaultHeight = 30;
    const expanderRadius = 8;
    const spaceV=0;
    const spaceH=38;
    const margins={left: 10, right: 10, top:8, bottom: 8};
    const branchColors = ['red', 'green', 'gold', 'teal', 'darkviolet', 'firebrick', 'forestgreen', 'blue', 'tomato', 'lightseagreen'];
    const backgroundColors = ['white', '#282923'];
    const textColors = ['black', 'white'];
    const itemColors = ['whitesmoke', 'darkslategray'];
    const treeStates = ['none', 'newjoin'];
    var themeId = 1;
    var idCounter = 0;
    var joinCounter = 0;
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext("2d");
    var branchColorNum = -1;
    var joinFrom;
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
        //let toolbar = document.getElementById("toolbar");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;//-toolbar.clientHeight;
        canvas.offsetTop = 0;
    }
    function changeRect(rect, left, top, width, height){
        rect.segments[0].point.x = left;
        rect.segments[0].point.y = top+height;
        rect.segments[1].point.x = left;
        rect.segments[1].point.y = top;
        rect.segments[2].point.x = left+width;
        rect.segments[2].point.y = top;
        rect.segments[3].point.x = left+width;
        rect.segments[3].point.y = top+height;                
    }

    function showIntersections(path1, path2) {
        let intersections = path1.getIntersections(path2);
        for (let i = 0; i < intersections.length; i++) {
            new Path.Circle({
                center: intersections[i].point,
                radius: 5,
                fillColor: '#009dec'
            }).removeOnMove();
        }
    }  
    function drawArrow(path, a,b, h1, h2, event){
        let vector = b.subtract(a);
        let v1 = h1;
        let v2 = h2;

        if (!(v1)) v1 = new Point({angle: vector.angle-30, length: 100});
        if (!(v2)) v2 = new Point({angle: vector.angle+180-30, length: 100});
        path.segments = [[a, null, v1], [b, v2, null]];
        
        let leftSide = new Point({angle:v2.angle+10,length:20});
        let rightSide = new Point({angle:v2.angle-10,length:20});
        
        path.add(b.add(leftSide)) ;
        path.add(b);
        path.add(b.add(rightSide))
        // path.fullySelected = true;
    }

    function drawPoint(point, color){
        let pt = new Path.Circle(point, 5);
        pt.fillColor = color;
    }

    //------------------------------
    class Tree {
        constructor(){
            init();
            let _items = new Map();
            this.items = _items;
            let _joins = new Map();
            this.joins = _joins;

            this._offset = {x:0, y:0};
            this.root =  new Item(this, 0, "CENTRAL TOPIC");
            this._focused = this.root;
            this.background = new Path.Rectangle(new Rectangle(new Point(0,0), new Size(canvas.width,canvas.height)));
            this.background.fillColor = backgroundColors[themeId];
            this.state = 'none';

            //текст
            let infoText_ = new PointText({
                content: "",
                fillColor: 'white',
                fontFamily: "Calibri",
                fontWeight: "",
                fontSize: 12,
                position: [30,30],
            });
            this.infoText = infoText_;

            this.info = 'здесь информация'; 
            let _newJoin = new Path();
            let _self = this;
            let doMouseUp = function(event) {
                let join;
                if (_self.state === 'newjoin'){
                    let dstItem = _self.mouseOnItem(event.point);
                    if (dstItem) 
                        join = new Join(_self, _self.focused, dstItem, event.point);
                    _self.state = 'none';
                    _newJoin.visible = false;
                    _self.refresh();
                }
            }
            let doMouseMove = function(event) {
                _self.info = event.point;
                if (_self.state === 'newjoin') {
                    let a = joinFrom.itemRect.center;
                    let b = event.point;
                    _newJoin.dashArray = [10,4];
                    _newJoin.strokeWidth = 3;
                    _newJoin.strokeColor = 'yellow';
                    _newJoin.visible = true;
                    drawArrow(_newJoin, a,b);
                    // let joinWidth = Math.sqrt(Math.pow(b.x-a.x,2) + Math.pow(b.y-a.y,2));
                    // let joinAngle = (Math.sin((b.y-a.y) / joinWidth) * 360)-180;
                    // _newJoin.segments = [
                    //     [a, null, _joinVector.rotate(joinAngle-180)],
                    //     [b, _joinVector.rotate(joinAngle), null]
                    // ];

                    for (let itm of _self.items.values()) {
                        showIntersections(_newJoin, itm.rect);
                    }
                }

            }
            let doMouseDrag = function(event) {
                if (_self.state === 'none'){
                    _self._offset.x = _self._offset.x + event.delta.x;
                    _self._offset.y = _self._offset.y + event.delta.y; 
                    for (let itm of _self.items.values()) _self.paint(itm);
                    for (let join of _self.joins.values()) _self.paintJoin(join);    
                }

            }            
            view.onMouseUp = doMouseUp;
            view.onMouseMove = doMouseMove;
            view.onMouseDrag = doMouseDrag;
            canvas.addEventListener('wheel',function(event){
                let oldZoom = view.zoom;
                view.zoom += event.wheelDelta / 2000;
                changeRect(_self.background, view.bounds.left ,view.bounds.top, view.size.width, view.size.height);
                return false; 
            }, false);

            let btnAddSibling = document.getElementById("addSibling");
            btnAddSibling.onclick = function(event) {
                _self.append(_self.focused.pid, "New Sibling")
            }
            let btnAddChild = document.getElementById("addChild");
            btnAddChild.onclick = function(event) {
                _self.append(_self.focused.id, "New Child")
            }
            let btnEditText = document.getElementById("editText");
            btnEditText.onclick = function(event) {
                _self.editText(_self.focused);
            }
            let btnAddJoin = document.getElementById("addJoin");
            btnAddJoin.onclick = function(event) {
                joinFrom = _self.focused;
                _self.state = 'newjoin'
            }            
            let btnDelete = document.getElementById("delete");
            btnDelete.onclick = function(event) {
                let par = _self.focused.parent;
                let prev = _self.prev(_self.focused);
                _self.remove(_self.focused);
                if (prev) {
                    _self.focused = prev;
                } else {
                    _self.focused = par;
                }
                _self.refresh();
            }

            //зуммирование через мультитач
            let scaling = false;
            let dist = 0;
            let scale_factor = 1.0;
            let curr_scale = 1.0;
            let max_zoom = 8.0;
            let min_zoom = 0.5;
            let distance = function(p1,p2) {
                return (Math.sqrt(Math.pow((p1.clientX - p2.clientX), 2) + Math.pow((p1.clientY-p2.clientY),2)));
            }
            canvas.addEventListener('touchstart', function(event) {
                event.preventDefault();
                let tt = event.targetTouches;
                if (tt.length >=2) {
                    dist = distance(tt[0], tt[1]);
                    scaling = true;
                } else {
                    scaling = false;
                }
            }, false);
            canvas.addEventListener('touchmove', function(event) {
                event.preventDefault();
                let tt = event.targetTouches;
                if (scaling) {
                    curr_scale = distance(tt[0],tt[1]) / dist * scale_factor;
                    view.zoom = curr_scale;
                    //changeRect(_self.background, view.bounds.left ,view.bounds.top, view.size.width, view.size.height);
                }
            }, false);
            canvas.addEventListener('touchend', function(event) {
                var tt = event.targetTouches;
                if (tt.length < 2) {
                    scaling = false;
                    if (curr_scale < min_zoom) {
                        scale_factor = min_zoom;
                    } else {
                        if (curr_scale > max_zoom) {
                            scale_factor = max_zoom;
                        } else {
                            scale_factor = curr_scale;
                        }
                    }
                    view.zoom = scale_factor;
                    //(_self.background, view.bounds.left ,view.bounds.top, view.size.width, view.size.height);
                } else {
                    scaling = true;
                }
            }, false);            
            return this;
        }
        get info(){
            return this.infoText.content;
        }
        set info(value) {
            this.infoText.content = value;
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
            this.focused = itm;
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
        mouseOnItem(point) {
            for (let itm of this.items.values()){
                if (itm.itemRect.contains(point))
                    return itm;
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
            for (let join of this.joins.values()) 
                this.paintJoin(join);
        }
        refresh(){
            this.recalc();
            for (let itm of this.items.values()) 
                this.paint(itm);
            for (let join of this.joins.values()) 
                this.paintJoin(join);
        }
        paintJoin(join){
            let a = join.srcItem.itemRect.center.add(join.srcDelta);
            let b = join.dstItem.itemRect.center.add(join.dstDelta);
            join.path.fullySelected = (join === this.focused);
            join.path.visible = true;
            drawArrow(join.path, a,b, join.h1, join.h2);
        }
        paint(itm){
            let self = this;
            let par = itm.parent;
            let itemExpanded = itm.parentExpanded;
            init();
            this.background.width = canvas.width;
            this.background.height = canvas.height;
            this.background.sendToBack();
            if (itemExpanded) {
                //line
                let firstSegment = new Segment({
                    point: [this.offset.x + itm.x,this.offset.y + itm.y]
                });
                let secondSegment = new Segment({
                    point: [this.offset.x + itm.right,this.offset.y + itm.y]
                }); 
                itm.line.segments = [firstSegment, secondSegment]; 
                itm.line.strokeWidth = 2;
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
                    itm.branch.strokeWidth = 2;
                    itm.branch.smooth({ type: 'continuous' });
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
                    itm.rect.strokeColor = 'goldenrod';
                    itm.rect.strokeWidth = 2;
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
                    _branchColor = 'white'
                else    
                    _branchColor = this.parent.branchColor;          
            }

            this.branchColor = _branchColor; 
            this.line = new Path({strokeColor: this.branchColor, strokeWidth: 1});
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
        get itemRect(){
            return new Rectangle(new Point(this.tree.offset.x+ this.x, this.tree.offset.y+this.top), new Size(this.width, this.height-this.line.strokeWidth-1));
        }
        get itemCenterPoint() {
            return this.itemRect.center;
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
    class Join{
        constructor(tree,srcItem, dstItem, toPoint){
            let _id = 'join' + newId();
            this.id = _id;
            let _tree = tree;
            this.tree = _tree;
            this.tree.joins.set(this.id, this);
            this.srcItem = srcItem;
            let _dstItem = dstItem;
            this._dstItem = _dstItem;
            this.dstItem = _dstItem;
            //начальные точки в абсолютных координатах
            let srcCenter = this.srcItem.itemRect.center.clone();
            let dstCenter = toPoint.clone();// this.dstItem.itemRect.center.clone();
            //drawPoint(srcCenter,'yellow');
            //drawPoint(dstCenter,'red');
             //общий вектор
            let tempVector = dstCenter.subtract(srcCenter);
            //наклон на 45 относительно общего вектора
            let srcHandle = new Point({angle: tempVector.angle-30, length: 100});
            let dstHandle = new Point({angle: tempVector.angle+180-30, length: 100});
            this.srcHandle = srcHandle;// вершина начала в относительных координатах
            this.dstHandle = dstHandle;// вершина конца  в относительных координатах
            
            //определяем точки соприкосновения
            let tempPath = new Path();
            //(srcCenter, toPoint);
            tempPath.segments = [[srcCenter, null, srcHandle],[toPoint, dstHandle, null]];

//            tempPath.visible = false;
//            drawArrow(tempPath, srcCenter,toPoint, srcHandle, dstHandle);

            let intersections = tempPath.getIntersections(this.srcItem.rect);
            let srcPoint = intersections[0].point.clone();
            this.srcDelta = srcPoint.subtract(srcCenter); //в относительных координатах

            let dstIntersections = tempPath.getIntersections(this.dstItem.rect);
            let dstPoint = dstIntersections[dstIntersections.length-1].point.clone();
            this.dstDelta = dstPoint.subtract(dstItem.itemRect.center);
            
            tempPath.remove();

            let joinVector = dstPoint.subtract(srcPoint);
            srcHandle = new Point({angle: joinVector.angle -30, length:100});
            dstHandle = new Point({angle: joinVector.angle +180 -30, length:100});

            let path = new Path();
            drawArrow(path, srcPoint,dstPoint, srcHandle, dstHandle);
            //path.middlePoint()
            path.strokeColor = this.srcItem.branchColor;
            path.dashArray = [3,1];
            path.strokeWidth = 5;
            path.visible = true;

            this.path = path;
            let _self = this;
            path.onMouseDown = function(event) {
                _self.tree.focused = _self;
            }
            // let doMouseDrag = function(event){
            //     this.srcItem.itemRect.centerPoint;
            // }
            return this;
        }
        get dstItem(){
            return this._dstItem;
        }
        set dstItem(value){
            this._dstItem = value;

        }
    }

    paper.project.clear();   
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
    paper.settings.handleSize = 2;
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