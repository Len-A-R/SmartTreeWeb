$(document).ready(function() { 
    paper.install(window);
    paper.setup("myCanvas");
    'use strict';

    const defaultWidth = 100;
    const defaultHeight = 30;
    const expanderRadius = 8;
    const spaceV=8;
    const spaceH=38;
    const margins={left: 10, right: 10, top:8, bottom: 8};
    const branchColors = ['red', 'green', 'gold', 'teal', 'darkviolet', 'firebrick', 'forestgreen', 'blue', 'tomato', 'lightseagreen'];
    const branchType = 0;
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

    function addPoint(a,b) {
        let result = new Point(0,0);
        result.x = a.x + b.x;
        result.y = a.y + b.y;
        return result;
    }

    function newId(){
        idCounter += 1;
        return idCounter;
    }
    //------------функции измерения
    function getTextWidth(text, fontFamily, fontSize, fontWeight) {
        // let cvs = document.getElementById('myCanvas');
        // let ctx = cvs.getContext("2d");
        let path = new PointText(new Point(0,0));
        path.fontFamily = fontFamily;
        path.fontSize = fontSize;
        path.fontWeight = fontWeight;
        path.content = text;
        path.visible = false;
        let size = new Size(path.bounds.width, path.bounds.height);
        path.remove();
        return size;
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
    function isIntersected(path1, path2){
        return ((path1.getIntersections(path2).length > 0) || path1.contains(path2.bounds));
    }
    function drawArrow(path, a,b, h1, h2){
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
            let group = new Group();
            this.group = group;
            this._offset = {x:0, y:0};
            this.root =  new Item(this, 0, "CENTRAL TOPIC");
            this._focused = this.root;
            this.background = new Path.Rectangle(new Rectangle(new Point(0,0), new Size(canvas.width,canvas.height)));
            this.background.fillColor = backgroundColors[themeId];
            let dragStatus = 'none';
            this._dragStatus = dragStatus;
            this.dragStatus = dragStatus;
            let selected = [];
            this.selected = selected;
            
            //текст
            let infoText_ = new PointText({
                content: "",
                fillColor: 'white',
                fontFamily: "Calibri",
                fontWeight: "",
                fontSize: 12,
                position: [30,30],
            });
            //текст
            let infoSecondText_ = new PointText({
                content: "",
                fillColor: 'yellow',
                fontFamily: "Calibri",
                fontWeight: "",
                fontSize: 12,
                position: [30,50],
            });
            this.infoText = infoText_;
            this.infoSecondText = infoSecondText_;

            this.info = 'здесь информация'; 
            this.infoSecond = 'текущее состояние';
            this._state = '';
            this.state = 'none';

            let _newJoin = new Path();
            let _self = this;

            let selectionPath = new Path();
            selectionPath.strokeWidth = 1;
            selectionPath.strokeColor = 'skyblue';
            selectionPath.segments = [{point: {x: 0, y:0}}, {point: {x:0,y:0}}, {point:{x:0, y:0}}, {point:{x:0, y:0}}];
            this.selectionPath = selectionPath;
            let _selectionRect = new Rectangle({from:[0,0], to: [0,0]});
            selectionPath.strokeWidth = 2;
            selectionPath.strokeColor = 'royalblue';
            selectionPath.fillColor = 'royalblue';
            selectionPath.fillColor.alpha = 0.5;
            this._selectionRect = _selectionRect;
            this.selectionRect = _self._selectionRect;

            let mouseDownPoint = new Point(0,0);
            let pressTimer;
            let doMouseDown = function(event){
                if ((_self.state === 'none') && (event.event.ctrlKey)){
                    _self.state = 'selection'; 
                    mouseDownPoint = event.point;
                    //_self.selectionRect.from = event.point;
                    _self.selectionPath.visible = true;
                    _self.selectionRect = new Rectangle({from: event.point, to: event.point});
                }
            }
            let doMouseUp = function(event) {
                let join;
                clearTimeout(pressTimer);
                if (_self.state === 'newjoin'){
                    let offsetPoint = event.point.clone();
                    offsetPoint.x -= _self.offset.x;
                    offsetPoint.y -= _self.offset.y;
                    let dstItem = _self.mouseOnItem(event.point);
                    if (dstItem) {
                        let txt = prompt('Введите текст', 'New join');
                        let mousePoint = event.point.clone();
                        join = new Join(_self, _self.focused, dstItem, mousePoint, txt);
                    }
                    _self.state = 'none';
                    _newJoin.visible = false;
                    _self.refresh();
                }
                if (_self.state === 'selection') {
                    _self.selectionRect = new Rectangle({from: mouseDownPoint, to: event.point});
                    _self.selectionPath.visible = false;
                    _self.state = 'none';
                }
            }
            let doMouseMove = function(event) {
                _self.info = event.point;
                if (_self.state === 'newjoin') {
                    let a = joinFrom.itemRect.center;
                    a.x += tree.offset.x;
                    a.y += tree.offset.y;
                    let b = event.point;
                    _newJoin.dashArray = [10,4];
                    _newJoin.strokeWidth = 3;
                    _newJoin.strokeColor = 'yellow';
                    _newJoin.visible = true;
                    drawArrow(_newJoin, a,b);
                    for (let itm of _self.items.values()) {
                        showIntersections(_newJoin, itm.rect);
                    }
                }
            }
            let doMouseDrag = function(event) {
                if (_self.state === 'none'){
                    _self.group.position.x += event.delta.x;
                    _self.group.position.y += event.delta.y;
                    _self._offset.x += event.delta.x;
                    _self._offset.y += event.delta.y; 
                }
                if (_self.state === 'selection'){
                    _self.selectionRect = new Rectangle({from: mouseDownPoint, to: event.point});
                    for (let itm of _self.items.values()) {

                        // itm.selected = _self.selectionPath.isInside(itm.itemRect);
                        itm.selected = itm.rect.isInside(_self.selectionRect);
                       // itm.selected = (isIntersected(_self.selectionPath, itm.rect));
                    } 
                }
            }         

            view.onMouseDown = doMouseDown;
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
                _self.append(_self.focused.pid, "New Sibling");
                btnAddSibling.blur();
            }
            let btnAddChild = document.getElementById("addChild");
            btnAddChild.onclick = function(event) {
                _self.append(_self.focused.id, "New Child");
                btnAddChild.blur();
            }
            let btnEditText = document.getElementById("editText");
            btnEditText.onclick = function(event) {
                _self.editText(_self.focused);
                btnEditText.blur();
            }
            let btnAddJoin = document.getElementById("addJoin");
            btnAddJoin.onclick = function(event) {
                joinFrom = _self.focused;
                _self.state = 'newjoin'
                btnAddJoin.blur();
            }            
            let btnDelete = document.getElementById("delete");
            btnDelete.onclick = function(event) {
                let par = _self.focused.parent;
                let prev = _self.prev(_self.focused);
                if (_self.selected.length > 0){
                    for (let i = _self.selected.length; i--;){
                        _self.remove(_self.selected[i]);
                    }
                    _self.selected = [];
                } else {
                    _self.remove(_self.focused);
                    if (prev) {
                        _self.focused = prev;
                    } else {
                        _self.focused = par;
                    }
                }
                _self.recalc();
                _self.refresh();
                btnDelete.blur();
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
        set dragStatus(value) {
            this._dragStatus = value;
            if (value === 'start') {
                document.body.style.cursor = 'grab'
            }
            if (value === 'move') {
                document.body.style.cursor = 'grabbing'
            }
            else if (value === 'allow') {
                document.body.style.cursor = 'pointer'
            }
            else if (value === 'deny') {
                document.body.style.cursor= 'no-drop'
            }  
            else
                document.body.style.cursor = 'default';          
        }
        get dragStatus(){
            return this._dragStatus;
        }
        set selectionRect(value){
            this._selectionRect = value;
            this.selectionPath.segments = [[value.topLeft, null, null],
                                           [new Point(value.left,value.bottom), null, null],
                                           [value.bottomRight, null, null],
                                           [new Point(value.right,value.top),null,null]];
        }
        get selectionRect(){
            return this._selectionRect;
        }
        get info(){
            return this.infoText.content;
        }
        set info(value) {
            this.infoText.content = value;
        }
        get infoSecond(){
            return this.infoSecondText.content;
        }
        set infoSecond(value) {
            this.infoSecondText.content = value;
        }        
        get state(){
            return this._state;
        }
        set state(value){
            this._state = value;
            this.infoSecond = value;
        }
        get offset() {
            return this._offset;
        }
        set offset(value) {
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
                if (this._focused instanceof Join) {
                    this._focused.startJoinHandle.visible = false;
                    this._focused.finishJoinHandle.visible = false;
                }
                this._focused = value;
                for (let itm of this.items.values()){
                    itm.selected = false;
                }
                if (value instanceof Join) {
                    // value.h1 = value.h1;
                    // value.h2 = value.h2;

                    value.startJoinHandle.position = value.handleStartPoint; 
                    value.finishJoinHandle.position = value.handleFinishPoint;
                    value.startJoinHandle.visible = true;
                    value.finishJoinHandle.visible = true;
                }                
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
            let offsetPoint = point.clone();
            offsetPoint.x -= this.offset.x;
            offsetPoint.y -= this.offset.y;
            for (let itm of this.items.values()){
                if (itm.itemRect.contains(offsetPoint))
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
            else {
                let itm = this.find(id);
                if (itm)
                    if (itm.isFlow){
                        parOutTop = itm.top - ((itm.outerHeight - itm.height)/ 2);
                    }
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
                if (par) {
                    parRight = par.right;
                
                    cur._x = parRight + spaceH;
                    cur._y = cur.outerTop + ((cur.outerHeight + cur.height)/2);
                }

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
                for (let join of this.joins.values()){
                    if ((join.srcItem === itm) || (join.dstItem === itm)){
                        join.remove();
                    }
                }
                while (this.hasChild(itm.id)) {
                    this.remove(this.firstChild(itm));
                }

                itm.selectionRect.remove();
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
            for (let itm of this.items.values()){
                if (!itm.parent) {
                    this.calc(itm.id);
                } 
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
            let a = join.srcItem.rect.bounds.center.add(join.srcDelta);
            let b = join.dstItem.rect.bounds.center.add(join.dstDelta);

            join.path.fullySelected = ((join) && (join === this.focused));
            join.path.visible = true;            
            if (join.path.fullySelected) {
                //join.path.segments[0]
                
            }
            join.refresh();
            drawArrow(join.path, a,b, join.h1, join.h2, join.text);
            join.path.strokeColor.alpha = 0.8;
            join.srcCircle.position = a;
            join.path.bringToFront();
            join.textPath.bringToFront()
            join.srcCircle.bringToFront();
            join.startJoinHandle.bringToFront();
            join.finishJoinHandle.bringToFront();            
        }
        paint(itm){
            let self = this;
            let par = itm.parent;
            let itemExpanded = itm.parentExpanded;
            init();
            if (this.background) {
                this.background.width = canvas.width;
                this.background.height = canvas.height;
                this.background.sendToBack();
            }
            if (itemExpanded) {
                // line
                let firstSegment = new Segment({
                    point: [this.offset.x + itm.x,this.offset.y + itm.y]
                });
                let secondSegment = new Segment({
                    point: [this.offset.x + itm.right,this.offset.y + itm.y]
                }); 
                itm.line.segments = [firstSegment, secondSegment]; 
                itm.line.strokeWidth = 2;
                //branch    
                if (par) {
                    let startPoint = new Point(this.offset.x + itm.x, this.offset.y+itm.y);
                    let endPoint = new Point(this.offset.x + par.right+(expanderRadius*2), this.offset.y + par.y);
                    let rc = new Rectangle(startPoint, endPoint);
                    let c = rc.center;
                    let h1 = new Point(c.x, this.offset.y+itm.y); 
                    let h2 = new Point(c.x, this.offset.y+par.y);
                    if (itm.branch) itm.branch.remove();
                    itm.branch = new Path();
                    itm.branch.add(startPoint);
                    if (branchType === 0) {
                        itm.branch.cubicCurveTo(h1,h2, endPoint);
                        //itm.branch.smooth({ type: 'continuous' });
                    } else if (branchType === 1){
                        itm.branch.add(endPoint);
                    } else if (branchType === 2) {
                        itm.branch.add(new Point(startPoint.x, endPoint.y));
                        itm.branch.add(endPoint);
                    }
                    itm.branch.strokeColor = itm.branchColor;
                    itm.branch.strokeWidth = 2;
                    
                    this.group.addChild(itm.branch);
                }
                //text
                itm.textItem.fillColor = textColors[themeId];
                //itm.textItem.point = [this.offset.x+ itm.x+margins.left, itm.itemCenterPoint.y];// - ((itm.height-spaceV)/2)];//- (itm.height/2) + margins.top + margins.bottom -itm.line.strokeWidth-1];
                itm.textItem.point = [this.offset.x + itm.x + margins.left, 
                                      this.offset.y + itm.y - itm.textItem.bounds.height + margins.top - itm.line.strokeWidth-1];
                itm.textItem.onClick = function(event) {
                    self.focused = itm;
                }
                itm.textItem.onDoubleClick = function(event) {
                    self.editText(itm);
                }

                //rect
                let bkRect = new Rectangle(new Point(this.offset.x + itm.x, this.offset.y + itm.top), new Size(itm.width, itm.height-itm.line.strokeWidth-1));
                let corner = new Size(8,8);
                itm.rect.remove();
                itm.rect = new Path.Rectangle(bkRect, corner);
                this.group.addChild(itm.rect);

                itm.rect.fillColor = itemColors[themeId];
                itm.rect.onClick = function(event) {
                    self.focused = itm;
                }
                itm.rect.onDoubleClick = function(event) {
                    self.editText(itm);
                }
                if (this.focused) {
                    if (itm.id === this.focused.id) {
                        itm.rect.strokeColor = 'goldenrod';
                        itm.rect.strokeWidth = 2;
                    }
                }

                itm.line.bringToFront();
                itm.textItem.bringToFront();
                if (itm.selected) {
                    itm.selectionRect.remove();
                    itm.selectionRect = new Path.Rectangle(bkRect, corner);
                    itm.selectionRect.strokeWidth = 3;
                    itm.selectionRect.strokeColor = 'dodgerblue';
                    this.group.addChild(itm.selectionRect)
                }
                else{
                    itm.selectionRect.remove();
                }
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
                    this.group.addChild(itm.expander)
                }
                let childCount = this.getChildCount(itm.id);
                if (childCount === 0)
                    itm.expanderText.content = '+'
                else
                    itm.expanderText.content = childCount;
                itm.expanderText.point = [this.offset.x+ itm.right+5, this.offset.y + itm.y+4];
                //itm.expanderText.point = [itm.right+5,itm.y+4];
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
            tree.group.addChild(this.textItem);

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
            //линия итема
            this.line = new Path({strokeColor: this.branchColor, strokeWidth: 1});
            tree.group.addChild(this.line);
            //соединение
            this.branch = new Path({strokeColor: this.branchColor, strokeWidth: 1});
            tree.group.addChild(this.branch);
            //прямоугольник
            let _rect = new Path({fillColor: 'whitesmoke'});
            this.rect = _rect;
            tree.group.addChild(this.rect);
            //прямоугольник выделения
             this.selectionRect = new Path({strokeWidth:3, strokeColor: 'skyblue'});
            
            //кнопка раскрытия
            this.expander = new Path.Circle(new Point(this.right, this.y), 8);
            tree.group.addChild(this.expander);

            //текст кнопки раскрытия
            this.expanderText = new PointText({
                content: "0",
                fillColor: 'black',
                fontFamily: "Calibri",
                fontWeight: "",
                fontSize: 12,
            });
            tree.group.addChild(this.expanderText);

            let _self = this;

            this.textItem.bringToFront();
            let movingPath;
            let deltaOnItemMouseDown;
            this.textItem.onMouseDown = function(event){
                deltaOnItemMouseDown = new Point(event.point.x - _self.x + tree.offset.x, event.point.y - _self.y + tree.offset.y);
            }

            this.textItem.onMouseDrag = function(event){
                if (!movingPath){
                    tree.state = 'moveItem';
                    movingPath = _self.rect.clone();
                    if (movingPath.fillColor) movingPath.fillColor.alpha = 0.5;
                    if (movingPath.strokeColor) movingPath.strokeColor.alpha = 0.5;
                    tree.dragStatus = 'start';
                    movingPath.bringToFront();                        
                }
                if (tree.state === 'moveItem'){
                    movingPath.position.x += event.delta.x;
                    movingPath.position.y += event.delta.y;
                    _tree.info = movingPath.position;

                    let localMovingStatus = 'move';
                    for (let itm of tree.items.values()){
                        if (itm.rect.contains(event.point)) {
                            localMovingStatus = 'allow';
                            if ((_self === itm) || (_self.isChildItem(itm))) {
                                localMovingStatus = 'deny';
                            }
                        }
                    } 
                    tree.dragStatus = localMovingStatus; 
                }
            }     
            this.textItem.onMouseUp = function(event){
                if (tree.state === 'moveItem'){
                    
                    for (let itm of tree.items.values()){
                        if (itm.rect.contains(event.point)) {
                            if (_self !== itm) {
                                if (!_self.isChildItem(itm)) {
                                    _self.pid = itm.id;
                                    tree.refresh();
                                    break;
                                }
                            }
                        }
                    }
                    //плавающий топик  
                    if (tree.dragStatus === 'move'){
                        _self.pid = 0;
                        _self.branch.visible = false;
                        _self.x = tree.offset.x + event.point.x - deltaOnItemMouseDown.x;
                        _self.y = tree.offset.y + event.point.y - deltaOnItemMouseDown.y;
                        tree.recalc();
                    }
                    tree.state = 'none';
                    tree.dragStatus = 'none';
                }
                if (movingPath) {
                    movingPath.remove();
                    movingPath = null;
                }
            }  
     
            this.text = text;
            this._visible = true;
            let selected = false;
            this._selected = selected;
            this.selected = selected;
            return this;
        }
        isFlow(){
            return (this.pid === 0) && (this.id !== 1)
        }
        get selected(){
            return this._selected;
        }
        set selected(value){
            if (this._selected !== value) {
                this._selected = value;
                if (value) {
                    this.tree.selected.push(this);
                }
                else {
                    let idx = this.tree.selected.indexOf(this); 
                    this.tree.selected.splice(idx,1);
                }
                this.tree.recalc();
            }
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
            // return new Rectangle(new Point(this.tree.offset.x+ this.x, this.tree.offset.y+this.top), new Size(this.width, this.height-this.line.strokeWidth-1));
            return new Rectangle(new Point(this.x, this.top), new Size(this.width, this.height-this.line.strokeWidth-1));
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
                let tw = getTextWidth(this.textItem.content, `${this.textItem.fontFamily}`, `${this.textItem.fontSize}px`,  `${this.textItem.fontWeight}`);
                this.width = margins.left + tw.width + margins.right;
                this.height = margins.top + tw.height + margins.bottom;
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
        addChild(caption){
            return this.tree.append(this.id, caption);
        }
        isChildItem(itm){
            let par = this.tree.find(itm.pid);
            if (!par) 
                return false
            else if (par.id === this.id)
                return true
            else if (par.pid !== 0)
                return this.isChildItem(par)
            else
                return false;
        }
    }
    class Join{
        constructor(tree,srcItem, dstItem, toPoint, text){
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
            let srcCenter = this.srcItem.rect.bounds.center.clone();
            let dstCenter = this.dstItem.rect.bounds.center.clone();
        
            if (toPoint) dstCenter = toPoint;

             //общий вектор
            let tempVector = dstCenter.subtract(srcCenter);
            //наклон на 30 относительно общего вектора
            let srcHandle = new Point({angle: tempVector.angle-30, length: 100});
            let dstHandle = new Point({angle: tempVector.angle+180-30, length: 100});
            this.srcHandle = srcHandle;// вершина начала в относительных координатах
            this.dstHandle = dstHandle;// вершина конца  в относительных координатах
            
            //определяем точки соприкосновения
            let tempPath = new Path();
            tempPath.segments = [[srcCenter, null, srcHandle],[dstCenter, dstHandle, null]];

            let srcPoint = srcCenter;
            let intersections = srcItem.rect.getIntersections(tempPath);
            if (intersections.length>0)
                srcPoint = intersections[0].point.clone();
            this.srcDelta = srcPoint.subtract(srcCenter); //в относительных координатах

            let dstIntersections = dstItem.rect.getIntersections(tempPath);
            let dstPoint = dstItem.rect.bounds.center;
            if (dstIntersections.length>0)
                dstPoint = dstIntersections[0].point.clone();
            this.dstDelta = dstPoint.subtract(dstItem.rect.bounds.center);
            
            tempPath.remove();

            let joinVector = dstPoint.subtract(srcPoint);
            srcHandle = new Point({angle: joinVector.angle -30, length:100});
            dstHandle = new Point({angle: joinVector.angle +180 -30, length:100});

            let fillColor = this.srcItem.branchColor;
            this.fillColor = fillColor;

            //стрелка
            let path = new Path();
            srcPoint = srcPoint.subtract(tree.offset);
            dstPoint = dstPoint.subtract(tree.offset);
            drawArrow(path, srcPoint,dstPoint, srcHandle, dstHandle);
            path.strokeColor = this.fillColor;
            path.dashArray = [10,3];
            path.strokeWidth = 5;
            path.visible = true;
            this.path = path;
            tree.group.addChild(this.path);
            //Круглешок в начале
            let srcCircle = new Path.Circle({center: srcPoint, radius: 6});
            srcCircle.fillColor = 'white'
            srcCircle.strokeWidth = 2;
            srcCircle.strokeColor = this.fillColor;
            this.srcCircle = srcCircle;
            tree.group.addChild(srcCircle);
            //текст
            let textPath = new PointText(this.middlePoint);
            textPath.fillColor = 'white';
            textPath.justification = 'center';
            //textPath.position.x += textPath.bounds.width/2;
            this.textPath = textPath;
            tree.group.addChild(this.textPath);
            let join = this;
            textPath.onMouseDown = function(event) {
                tree.focused = join;
            }
            //фон текста
            let backRect = new Path.Rectangle(this.middlePoint, new Size(0,0));
            this.backRect =  backRect;
            this.backRect.onMouseDown = function(event) {
                tree.focused = join;
            }
            tree.group.addChild(this.backRect); 
            if (!(text)) {
                this.text = ''
            } 
            else{
                this.text = text;
            }
            let _self = this;
            textPath.onDoubleClick = function(event){
                let txt = prompt('Введите текст соединения:', _self.text);
                if ((_self.text !== txt) && (txt !== null))
                    _self.text = txt;
            }
            
            path.onMouseDown = function(event) {
                _self.tree.focused = _self;
            }
            path.onDoubleClick = function(event){
                let txt = prompt('Введите текст соединения:', _self.text);
                if ((_self.text !== txt) && (txt !== null))
                    _self.text = txt;
            }  
            let startJoinHandle = new Path.Circle(new Point(0,0), 10);
            startJoinHandle.strokeColor = 'red';
            startJoinHandle.strokeWidth = 2;
            startJoinHandle.fillColor = 'white';
            startJoinHandle.fillColor.alpha = 0.5;
            startJoinHandle.visible = false;
            startJoinHandle.onMouseDown = function(event){
                tree.state = 'handle';
            }
            startJoinHandle.onMouseDrag = function(event){
                tree.state = 'handle';
                startJoinHandle.position.x += event.delta.x;
                startJoinHandle.position.y += event.delta.y;

                path.segments[0].handleOut.x += event.delta.x;
                path.segments[0].handleOut.y += event.delta.y;
                _self.refresh();
            }
            startJoinHandle.onMouseUp = function(event){
                tree.state = 'none';
            }
            this.startJoinHandle = startJoinHandle;

            let finishJoinHandle = new Path.Circle(new Point(0,0), 10);
            finishJoinHandle.strokeColor = 'yellow';
            finishJoinHandle.strokeWidth = 2;
            finishJoinHandle.fillColor = 'white';
            finishJoinHandle.fillColor.alpha = 0.5;
            finishJoinHandle.visible = false;
            finishJoinHandle.onMouseUp = function(event){
                tree.state = 'handle';
            }
            finishJoinHandle.onMouseDrag = function(event){
                tree.state = 'handle';
                finishJoinHandle.position.x += event.delta.x;
                finishJoinHandle.position.y += event.delta.y;

                path.segments[1].handleIn.x += event.delta.x;
                path.segments[1].handleIn.y += event.delta.y;
                drawArrow(path,path.segments[0].point, path.segments[1].point, _self.h1, _self.h2);
                _self.refresh();
            }
            finishJoinHandle.onMouseUp = function(event){
                tree.state = 'none';
            }            
            this.finishJoinHandle = finishJoinHandle;
            tree.group.addChild(startJoinHandle);
            startJoinHandle.bringToFront();

            tree.group.addChild(finishJoinHandle);
            finishJoinHandle.bringToFront();
            return this;
        }
        get h1(){
            return this.path.segments[0].handleOut;
        }
        get h2(){
            return this.path.segments[1].handleIn;
        }
        get handleStartPoint(){
            return new Point(this.path.segments[0].point.x + this.h1.x, this.path.segments[0].point.y + this.h1.y);
        }
        get handleFinishPoint(){
            return new Point(this.path.segments[1].point.x + this.h2.x, this.path.segments[1].point.y + this.h2.y);
        }
        set h1(value){
            this.path.segments[0].handleOut = value;
            let startPoint = this.path.segments[0].point.clone();
            startPoint = startPoint.add(this.path.segments[0].handleOut);
            this.startJoinHandle.position = startPoint;            
        }
        set h2(value){
            this.path.segments[1].handleIn = value;
            let finishPoint = this.path.segments[1].point.clone();
            finishPoint = finishPoint.add(this.path.segments[1].handleIn);
            this.finishJoinHandle.position = finishPoint;            
        }
        get dstItem(){
            return this._dstItem;
        }
        set dstItem(value){
            this._dstItem = value;

        }
        get middlePoint(){
            let path_ = this.path.clone();
            let middlePath = path_.splitAt(this.path.length/2);
            let middlePoint = middlePath.firstSegment.point.clone();
            middlePath.remove();
            path_.remove();
            return middlePoint;
        }
        get startPoint(){
            return this.path.segments[0].point;
        }
        get finishPoint(){
            return this.path.segments[1].point;
        }
        refresh(){
            this.textPath.position = this.middlePoint;
            let rc = this.textPath.bounds.clone();
            rc.left -= 5;
            rc.top -= 3;
            rc.width += 10;
            rc.height += 6;
            
            let cornerSize = new Size(10,10);
            this.backRect.remove();
            this.backRect = new Path.Rectangle(rc, cornerSize);
            this.backRect.strokeColor = this.fillColor;
            this.backRect.strokeWidth = 2;
            this.backRect.fillColor = this.fillColor;
            //this.backRect.fillColor = backgroundColors[themeId];
            this.backRect.insertBelow(this.textPath);
            let tree = this.tree;
            let join = this;
        }
        get text(){
            return this.textPath.content;
        }
        set text(value){
            this.textPath.content = value;
            //let tw = getTextWidth(this.textPath.content, `${this.textPath.fontFamily}`, `${this.textPath.fontSize}px`,  `${this.textPath.fontWeight}`);
            this.refresh();
        }
        remove(){
            this.path.remove();
            this.textPath.remove();
            this.backRect.remove();
            this.tree.joins.delete(this.id);
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
                if (itm.pid !== 0) { 
                    itm = tree.append(tree.focused.pid, "Новый топик");
                }
                break;
            case 'delete':
                let btnDelete = document.getElementById("delete");
                btnDelete.click();
                break;
        }
        if (typeof itm !== 'undefined') tree.focused = itm;
        return false;
    }    
    paper.settings.handleSize = 2;
    tree.root.text = 'Варианты заявок';
    let params = tree.append(tree.root.id, '1. Параметры варианта');
    let prmPeriod = params.addChild('Период');
    let prmOtv = params.addChild('Ответственный');
    let prmSplitByItv = params.addChild('Разбить по ответственным');
    let prmKimType = params.addChild('Типы номенклатуры');
    let prmOnlyConfirmed = params.addChild('Только утвержденные ПП');
    let prmRefullSZP = params.addChild('Восполнять страховые запасы');
    let prmExWrh = params.addChild('Исключить склады');
    let prmOnlySup = params.addChild('Только по номенклатуре поставщика');

    let calcPot = tree.append(tree.root.id, '2. Выборка потребностей');
    let copyPot = calcPot.addChild('Копируем все записи таблицы потребностей с полями \r rwc, rwc_nom, rwc_ppp, dte, trn_id');
    let boundList = calcPot.addChild('Ограничения списка \r Удаляем всё лишнее');
    let boundListKimTyp = boundList.addChild('Ограничение списка по типам указанных потребностей');
    let joinKim = new Join(tree, boundListKimTyp, prmKimType, null, 'Параметры варианта');

    let boundListOnlyByOtv = boundList.addChild('Ограничение списка по номенклатуре ответственного снабженца');
    new Join(tree, boundListOnlyByOtv, prmOtv, null, null);
    let boundListOnlyBySup = boundList.addChild('Ограниение списка по номенклатуре поставщика');
    new Join(tree,boundListOnlyBySup, prmOnlySup, null, null);
    let boundListOnlyConfirmed = boundList.addChild('Только по подтвержденным ПП');
    let grpPotList = boundList.addChild('Группировка полученного списка - результат список номенклатуры');
    let getInfoByWrh = grpPotList.addChild('Получение информации от текущем количестве по всем складам в ЕИЗ расхода');
    getInfoByWrh.addChild('ЕИЗ');
    getInfoByWrh.addChild('Размер страхового запаса');
    getInfoByWrh.addChild('Текущее количество');
    let getInfoByRzp = boundList.addChild('Ожидаемые поступления');
    getInfoByRzp.addChild('Группировка полученных данных');
    let lstGozPP = calcPot.addChild('Список ПП по ГОЗ');

    // let item1 = tree.append(tree.root.id, "Chapter 1");
    // let item2 = tree.append(tree.root.id, "Chapter 2");
    // let item3 = tree.append(tree.root.id, "Chapter 3");
    // let item4 = tree.append(item1.id, "Item 1-1");
    // let item5 = tree.append(item1.id, "Item 1-2");
    // let item6 = tree.append(item2.id, "Item 2-1");
    // let item7 = tree.append(item2.id, "Item 2-2");
    // let item8 = tree.append(item2.id, "Item 2-3");
    // let item9 = tree.append(item7.id, "Item 2-2-1");    
    // let item10 = tree.append(item7.id, "Item 2-2-2");
    // let item11 = tree.append(item7.id, "Item 2-2-3");
    // item2.text = 'Это вторая глава книги Пески времени';
    // item6.text = '1';
    view.draw();
});