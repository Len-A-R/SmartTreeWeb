var paper = require('./js/paper.js');
paper.setup(new paper.Size(600, 600));

var cvs = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("myCanvas"));
var ctx = cvs.getContext("2d");
var newID = 0;
var map = new Map();
const horzSpaceBetweenItems = 20;
const vertSpaceBetweenItems = 10;
//------служебные функции

function info(item){
	let s = `id: ${item.id} \n` + 
			`pid: ${item.pid} \n` + 
			`text: ${item.text} \n` +
			`left: ${item.left} \n ` +
			`top: ${item.top} \n ` +
			`width: ${item.width} \n` + 
			`height: ${item.height} \n` + 
			`outerHeight: ${item.outerHeight}`;
	return s;
}
//------------функции измерения
function getTextWidth(text, font) {
    // re-use canvas object for better performance
    let sText = text;
    ctx.font = font;
    let metrics = ctx.measureText(sText);
    return metrics.width;
}

//------------------------------
function itemById(id){
	for (let itm of map.values()) {
		if (itm.id == id){
			return itm;
			break;
		}
	}
}
function getOuterHeight(id){
	let h = 0;
	for (let itm of map.values()){
		if (itm.pid == id) {
			h = h + getOuterHeight(itm.id) + vertSpaceBetweenItems;
		}
	}
	if (h==0) {
		h = itemById(id).height;	
	}
	else {
		h = h - vertSpaceBetweenItems;
	}
	return h; 
}

function getPrevItem(item) {
	let old;
	for (let itm of map.values()) {
		if (itm.pid == item.pid) {
			if (itm.id == item.id) {
				break;
			} else {
				old = itm
			};
		}
	}
	return old
}

function getNextItem(item) {
	let curFounded = false;
	let founded;
	for (let itm of map.values()) {
		if ((itm.id == item.id) & (curFounded==false)) {
			curFounded = true;
		} else {
			if ((itm.pid == item.pid) & (curFounded==true)) {
				founded = itm;
				break; 
			}
		}
	}
	return founded;
}
//------------------------------

class Item{
	get id(){
		return _id
	}
	get pid(){
  		return _pid;
	}
	get text() {
  		return _text;
	}
	set text(value) {
		if (this._text != value) {
			this._text = value;

			this.width = getTextWidth(this._text, 'bold 12pt arial');
		}
	}
	get deltaTop() {
		let xtop = 0;
		let previousItem = this.prev;
		if (!!previousItem) {
			xtop = previousItem.deltaBottom + vertSpaceBetweenItems;
		}
		return xtop;		
	}
	get top() {
		let pTop = 0;
		if (!!this.parent) {
			pTop = this.parent.top 
		} 

		let dY = 0;
		let previousItem = this.prev;
		if (!!previousItem) {
			dY = previousItem.deltaBottom + vertSpaceBetweenItems; 
		}
		return pTop + dY; 
	}
	get absTop() {
		return (this.top + (this.outerHeight - this.height) / 2)
	}
	get deltaBottom() {
		return this.deltaTop + this.outerHeight;
	}
	get bottom(){
		return this.top+this.outerHeight + vertSpaceBetweenItems;
	}
	get absBottom() {
		return this.absTop+this.height;
	}
  get width() {
  	return _width;
  } 
  set width(value) {
  	_width = width;
  }
  get height() {
  	return _height;
  }
	get prev(){
		let itm = getPrevItem(this);
		return itm;
	}
	get next(){
		let itm = getNextItem(this);
		return itm;
	}
	get left(){
		let xleft = 0;
		if (!!this.parent) { 
			xleft = this.parent.right + horzSpaceBetweenItems;
		}
		return xleft;
	}

	get right(){
		return this.left+this.width
	}
	get outerHeight(){
		return getOuterHeight(this.id)
	}
	constructor(pid=0, text="New Item"){
		var _id = ++newID;
		var _pid = pid;
		var _text = "";
		var	_width = 30;
		var _height = 20;
    	this.text = text;
		map.set(this.id, this);
	}
	get parent(){
		return itemById(this.pid)
	}
}

let itemRoot = new Item(0,"ROOT");
let item1 = new Item(itemRoot.id, "Chapter 1");
let item2 = new Item(itemRoot.id, "Chapter 2");
let item3 = new Item(itemRoot.id, "Chapter 3");
let item4 = new Item(item1.id, "Item 1-1");
let item5 = new Item(item1.id, "Item 1-2");
let item6 = new Item(item2.id, "Item 2-1");
let item7 = new Item(item2.id, "Item 2-2");
let item8 = new Item(item2.id, "Item 2-3");
let item9 = new Item(item7.id, "Item 2-2-1");
let item10 = new Item(item7.id, "Item 2-2-2");
let item11 = new Item(item7.id, "Item 2-2-3");

function drawBranches(itm) {
	let path = new Path();
	let par = itm.parent;
	if (!!par) {
		path.strokeColor = "red";
		path.lineWidth = 1;		
		path.moveTo(itm.left, itm.absBottom);
		path.bezierCurveTo(par.right, itm.absBottom, itm.left, par.absBottom, par.right, par.absBottom);

		// path.stroke();
	}
	 
}

function drawStuff(){
    let path  = new Path();
	let rectangle;
	let radius;
    
   // ctx.fillStyle = 'white';
//    ctx.fillRect(0, 0, canvas.width, canvas.height);

//var path = new Path.Rectangle(rectangle, radius);
//path.fillColor = 'black';

	for (let itm of map.values()){
		drawBranches(itm);
		//alert(info(itm))
		path.fillColor = "whitesmoke";
		path.strokeColor = "red";
		path.lineWidth = 2;

		rectangle = new Rectangle(new Point(itm.left, itm.absTop), new Point(itm.left + itm.width, itm.absTop + itm.height));
		radius = new Size(6, 6);
		path = new Path(rectangle, radius);
		// path.roundRect(itm.left, itm.absTop, itm.width, itm.height,6, true);
		// ctx.fillStyle = "black";
		// ctx.font = "bold 12pt arial";
		// ctx.fillText(itm.text,itm.left, itm.absBottom-4);
		// ctx.stroke();
	}

}

drawStuff();
