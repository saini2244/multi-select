import {ChangeDetectorRef, Component, HostListener, Inject, Input, OnChanges, OnInit, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {GoogleAnalyticsContent} from '../../services/google-analytics.content';
import {ZoomPercentagePipe} from '../../pipes/zoom-percentage.pipe';
import {GrowlService} from 'ngx-growl';
import { debounce } from 'src/app/shared/CommonService';
import {ImageService} from "../../services/image.service";
import { DomSanitizer } from '@angular/platform-browser';
import { PLATELET, RBC } from '../../utils/enumerator';
import { AnalysisReportService } from 'src/app/core/http/services';
import { CommonReportDataService } from 'src/app/features/report/services/common-report-data.service';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit, OnChanges{

  lastX: any;
  lastY: any;
  dragStart: any;
  dragEnd : any;
  dragged: any;
  imageCanvas: any;
  fullImageCanvas: any;
  imageCtx: any;
  fullImageCtx: any;
  image: any;
  totalZoomPerc = 40;
  startingZoomPerc = 40;
  zoomPerc: number = 10;
  maxZoomPercForRollOverEnable: number = 100;
  activeIndex: number;
  siblings;
  isCanvasHovered = false;
  isSpinner: boolean = false;
  zoomPercentagePipe: any;
  zoomOptions = [40, 100];
  detailReportData : any;
  fovPpm : number;
  isCircleMeasureToolSelected : boolean =  false;
  isLineMeasureToolSelected : boolean = false;
  measureValue : number = 7;
  measureToolLengthInPx : number = 0;
  measureToolLastPosition : any = {};
  rotateBy: number = 0;
  isMeasureToolOpen : boolean = false; 
  toolSelected : string = "Line";
  measureToolMinLength : number = 5;
  measureToolMaxLength : number = 20;
  fixedRange = []; 
  tab : string = "";
  RBC = RBC;
  @Input() imageSource: string;
  @Input() annotationSets: Array<object> = [];
  @Input() hundredX : any;
  @Input() rbcCellExtractionCoordinates:any;
  @Input() fov : any;
  @Input() pageUrl: string;
  @Input() canvasId = 'custom_canvas';
  @Input() isEventResponsive = true;
  @Input() rollOverZoomFlag:boolean;
  @Input() isRollOverDisabled:boolean;
  @Output() updateIsRollOverDisabled = new EventEmitter();
  @Output() canvasLoad = new EventEmitter();


  constructor(private googleAnalyticsContent: GoogleAnalyticsContent, private domSanitizer: DomSanitizer, private growlService: GrowlService, private cdr: ChangeDetectorRef,
    private imageService: ImageService,
    private analysisReportService: AnalysisReportService,
    private commonReportDataServies: CommonReportDataService
  ) {
    this.showAnnotation = this.showAnnotation.bind(this);
    this.hundredXCircle = this.hundredXCircle.bind(this);
    this.loadImage = this.loadImage.bind(this);
    this.imageLoadHandler = this.imageLoadHandler.bind(this);
    this.resize = this.resize.bind(this);
    this.zoom = debounce(this.zoom.bind(this), 200);
    this.zoomToCenter = this.zoomToCenter.bind(this);
    this.onPointerCanvasExit = this.onPointerCanvasExit.bind(this);
    this.zoomPercentagePipe = new ZoomPercentagePipe();

  }

  ngOnInit() {
    this.canvasLoad.emit({isCanvasLoaded: false})
    this.detailReportData = this.commonReportDataServies.detailReportData;
    this.fovPpm = this.detailReportData.input.ppm_x;
    this.loadImage();
    this.analysisReportService.selectedMircoscopicTab.subscribe(tab => {
      this.tab = tab;
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    const {annotationSets, imageSource, hundredX,rbcCellExtractionCoordinates} = changes;
    if (annotationSets && annotationSets.currentValue) {
      if (annotationSets) {
        this.annotationSets = annotationSets.currentValue;
        this.redraw();
      }
    }
    if (imageSource && imageSource.currentValue) {
      this.canvasLoad.emit({isCanvasLoaded: false});
      this.imageSource = imageSource.currentValue;
      this.isCanvasHovered = false;
      this.loadImage();
    }
    if (hundredX && hundredX.currentValue) {
      if (hundredX) {
        this.hundredX = hundredX.currentValue;
        this.redraw();
      }
    }
    if (rbcCellExtractionCoordinates && rbcCellExtractionCoordinates.currentValue) {
      this.rbcCellExtractionCoordinates = rbcCellExtractionCoordinates.currentValue;
      this.redraw();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.totalZoomPerc = this.startingZoomPerc;
    this.resizeCanvasOnWinSizeChange();
  }

  zoom(clicks, lastZoomValue = this.totalZoomPerc, isRandomValue = false) {
    let factor;
    const isZoomIn = clicks > 0;
    const maxNextZoomValue = isRandomValue ? this.totalZoomPerc : this.totalZoomPerc + this.zoomPerc;
    const minNextZoomValue = isRandomValue ? this.totalZoomPerc : this.totalZoomPerc - this.zoomPerc;
    if ((isZoomIn && maxNextZoomValue > 350) || !isZoomIn && minNextZoomValue < 40) {
      const zoomLimitText = isZoomIn ? 'Maximum zoom in limit reached' : 'Minimum zoom out limit reached';
      this.growlService.addError({
        heading: 'Sorry',
        message: zoomLimitText
      });
      return;
    } else if (this.imageCtx) {
      if(isZoomIn) {
        factor = (maxNextZoomValue)/lastZoomValue;
        this.totalZoomPerc = maxNextZoomValue;
      } else {
        factor = (minNextZoomValue)/lastZoomValue;
        this.totalZoomPerc = minNextZoomValue;
      }
      if (this.totalZoomPerc > this.maxZoomPercForRollOverEnable) {
        if (!this.isRollOverDisabled || this.rollOverZoomFlag) {
          this.updateIsRollOverDisabled.emit({disabledValue: true, zoomFlag: false});
          this.growlService.addError({
            heading: 'Info',
            message: 'Roll over zoom is disabled, FOV is zoomed more than 100x'
          });
        }
      } else if (this.isRollOverDisabled) {
        this.updateIsRollOverDisabled.emit({disabledValue: false, zoomFlag: false});
      }
      const pt = this.imageCtx.transformedPoint(this.lastX, this.lastY);
      this.imageCtx.translate(pt.x, pt.y);
      this.imageCtx.scale(factor, factor);
      this.imageCtx.translate(-pt.x, -pt.y);
      this.redraw();
      if (this.pageUrl && this.pageUrl[2]) {
        this.googleAnalyticsContent.emitEvent(this.googleAnalyticsContent.eventMap.COMPONENT_MICROSCOPIC_VIEW_FOV_ZOOM, this.pageUrl[2] + '->' + 'Image zoom');
      }
    }
  }

  onZoomOptionSelect(selected) {
    if(selected !== this.totalZoomPerc) {
      const lastZoomValue = this.totalZoomPerc;
      this.totalZoomPerc = selected;
      // for 40 zoom resize the canvas as per requirement
      if(this.totalZoomPerc === 40) {
        this.resize();
      } else {
        this.zoomToCenter(1, lastZoomValue, true);
      }
    }
  }

  resize () {
    if(this.imageCtx){
      this.totalZoomPerc = this.startingZoomPerc;
      const transforms = this.imageCtx.getTransform();
      this.imageCtx.scale(1 / transforms.a, 1 / transforms.d);
      this.imageCtx.translate(-transforms.e, -transforms.f);
      this.lastX = this.imageCanvas.width / 2;
      this.lastY = this.imageCanvas.height / 2;
      this.updateIsRollOverDisabled.emit({disabledValue: false, zoomFlag: this.rollOverZoomFlag});
      this.redraw();
    }
  };

  zoomToCenter = (clicks, lastZoomValue = this.totalZoomPerc, isRandomValue = false) => {
    this.lastX = this.imageCanvas.width / 2;
    this.lastY = this.imageCanvas.height / 2;
    this.zoom(clicks, lastZoomValue, isRandomValue);
  }

  handleScroll(event) {
    this.lastX = this.imageCanvas.width / 2;
    this.lastY = this.imageCanvas.height / 2;
    const delta = event.wheelDelta ? event.wheelDelta / 40 :
      event.detail ? -event.detail : 0;
    this.isCanvasHovered = false;
    if (delta) {
      this.zoom(delta);
    }
    return event.preventDefault() && false;
  }

  redraw() {
    if(!this.imageCtx) {
      return;
    }
    const p1 = this.imageCtx.transformedPoint(0, 0);
    const p2 = this.imageCtx.transformedPoint(this.imageCanvas.width, this.imageCanvas.height);
    this.imageCtx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    this.imageCtx.drawImage(this.image, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
    this.showAnnotation(this.annotationSets);
    this.updateLoaderDisplay(false);
    if(this.isCircleMeasureToolSelected){
      this.isCircleMeasureToolSelected = false;
      this.addTool("circle", this.measureValue, false);
    }
    else if(this.isLineMeasureToolSelected){
      this.isLineMeasureToolSelected = false;
      this.addTool("line", this.measureValue, false);
    }
  }

  showAnnotation(annotationSets?) {
    if (!this.imageCanvas) {
      return;
    }
    this.imageCtx.lineWidth = 1;
    const widthRatio = this.image.width / this.imageCanvas.width;
    const heightRatio = this.image.height / this.imageCanvas.height;
    for (let i = 0; i < annotationSets.length; i++) {
      const points = [];
      const {cent_x, cent_y, size, color, is_curved} = annotationSets[i];
      this.imageCtx.strokeStyle = color || '#B0371D';
      this.imageCtx.setLineDash([]);
      const x = parseInt(cent_x, 10) / widthRatio;
      const y = parseInt(cent_y, 10) / heightRatio;
      const width = parseInt(size, 10) / widthRatio;
      const height = parseInt(size, 10) / heightRatio;
      points.push([x - width / 2, y - height / 2]);
      points.push([x + width / 2, y - height / 2]);
      points.push([x + width / 2, y + height / 2]);
      points.push([x - width / 2, y + height / 2]);
      const num_points = points.length;
      if (is_curved) {
        this.roundRect(this.imageCtx, points[0][0], points[0][1], width, height, 10, false, 1);
      } else {
        this.imageCtx.beginPath();
        this.imageCtx.moveTo(points[num_points - 1][0], points[num_points - 1][1]);
        for (let j = 0; j < num_points; j++) {
          this.imageCtx.lineTo(points[j][0], points[j][1]);
        }
      }
      this.imageCtx.closePath();
      this.imageCtx.stroke();
    }
    const tab = this.analysisReportService.selectedMircoscopicTab.value;
    if(tab == PLATELET && this.fov && this.fov.platelet_fov){
      this.hundredXCircle(this.hundredX);
    }

    if (tab == RBC && this.fov && this.fov.rbc_fov && this.rbcCellExtractionCoordinates) {
      if(this.rbcCellExtractionCoordinates.cell_extraction_rbc && this.rbcCellExtractionCoordinates.cell_extraction_rbc.x_center){
        this.cellExtractionArea(this.rbcCellExtractionCoordinates);
      }
    }
  }

  cellExtractionArea(area) {
    if (!this.imageCanvas) {
      return;
    }
    const widthRatio = this.image.width / this.imageCanvas.width;
    const heightRatio = this.image.height / this.imageCanvas.height;
    if (Object.keys(area).length) {
      const x_center = area.cell_extraction_rbc.x_center;
      const y_center = area.cell_extraction_rbc.y_center;
      const radius = area.cell_extraction_rbc.radius / widthRatio;
      this.imageCtx.strokeStyle = '#000000';
      this.imageCtx.setLineDash([]);
      const x = parseInt(x_center, 10) / widthRatio;
      const y = parseInt(y_center, 10) / heightRatio;
      this.imageCtx.beginPath();
      this.imageCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
      this.imageCtx.lineWidth = 1
      this.imageCtx.stroke();
    }
  }

  hundredXCircle(hundredX?) {
    if (!this.imageCanvas) {
      return;
    }
    const widthRatio = this.image.width / this.imageCanvas.width;
    const heightRatio = this.image.height / this.imageCanvas.height;
    if(this.hundredX) {
      hundredX.patches.forEach(ele => {
        const x_center = ele.platelet_100x_coordinates.x_center;
        const y_center = ele.platelet_100x_coordinates.y_center;
        const radius = ele.platelet_100x_coordinates.radius / widthRatio;
        this.imageCtx.strokeStyle = '#000000';
        this.imageCtx.setLineDash([]);
        const x = parseInt(x_center, 10) / widthRatio;
        const y = parseInt(y_center, 10) / heightRatio;
        this.imageCtx.beginPath();
        this.imageCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.imageCtx.lineWidth = 1
        this.imageCtx.stroke();
      })
    }
  }

  trackTransforms = function (ctx) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let xform = svg.createSVGMatrix();
    ctx.getTransform = function () { return xform; };

    const savedTransforms = [];
    const save = ctx.save;
    ctx.save = function () {
      savedTransforms.push(xform.translate(0, 0));
      return save.call(ctx);
    };
    const restore = ctx.restore;
    ctx.restore = function () {
      xform = savedTransforms.pop();
      return restore.call(ctx);
    };

    const scale = ctx.scale;
    ctx.scale = function (sx, sy) {
      xform = xform['scaleNonUniform'](sx, sy);
      return scale.call(ctx, sx, sy);
    };
    const rotate = ctx.rotate;
    ctx.rotate = function (radians) {
      xform = xform.rotate(radians * 180 / Math.PI);
      return rotate.call(ctx, radians);
    };
    const translate = ctx.translate;
    ctx.translate = function (dx, dy) {
      xform = xform.translate(dx, dy);
      return translate.call(ctx, dx, dy);
    };
    const transform = ctx.transform;
    ctx.transform = function (a, b, c, d, e, f) {
      const m2 = svg.createSVGMatrix();
      m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
      xform = xform.multiply(m2);
      return transform.call(ctx, a, b, c, d, e, f);
    };
    const setTransform = ctx.setTransform;
    ctx.setTransform = function (a, b, c, d, e, f) {
      xform.a = a;
      xform.b = b;
      xform.c = c;
      xform.d = d;
      xform.e = e;
      xform.f = f;
      return setTransform.call(ctx, a, b, c, d, e, f);
    };
    const pt = svg.createSVGPoint();
    ctx.transformedPoint = function (x, y) {
      pt.x = x; pt.y = y;
      return pt.matrixTransform(xform.inverse());
    };
  };

  imageLoadHandler () {
    this.imageCanvas = document.getElementById(this.canvasId);
    this.fullImageCanvas = document.getElementById("full-image");
    this.fullImageCanvas.width = this.image.width;
    this.fullImageCanvas.height = this.image.height;
    this.fullImageCtx = this.fullImageCanvas.getContext('2d', { willReadFrequently: true });
    this.fullImageCtx.drawImage(this.image, 0, 0);
    if(!this.imageCanvas) {
      return;
    }
    if (this.isEventResponsive) {
      this.imageCanvas.addEventListener('DOMMouseScroll', this.handleScroll.bind(this), false);
      this.imageCanvas.addEventListener('mousewheel', this.handleScroll.bind(this), false);
      this.imageCanvas.addEventListener('mousedown', this.mouseDownHandler.bind(this), false);
      this.imageCanvas.addEventListener('mousemove', this.mouseMoveHandler.bind(this), false);
      this.imageCanvas.addEventListener('mouseup', this.mouseUpHandler.bind(this), false);
      this.imageCanvas.addEventListener('mouseleave', this.onPointerCanvasExit.bind(this), false);
      document.addEventListener('mouseleave', this.onPointerCanvasExit.bind(this), false);
    }
    this.resizeCanvasOnWinSizeChange();
    this.canvasLoad.emit({isCanvasLoaded: true, width: this.image.width, height: this.image.height})
  }

  resizeCanvasOnWinSizeChange() {
    if(!this.imageCanvas) {
      return;
    }
    this.imageCtx = this.imageCanvas.getContext('2d');
    this.trackTransforms(this.imageCtx);
    const ratio = this.image.width / this.image.height;
    this.imageCanvas.width = document.getElementById(`canvas-container${this.canvasId}`).offsetWidth;
    this.imageCanvas.height = this.imageCanvas.width / ratio;
    this.redraw();
  }

  mouseDownHandler (evt) {
    document.body.style['mozUserSelect'] = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
    this.lastX = evt.offsetX || (evt.pageX - this.imageCanvas.offsetLeft);
    this.lastY = evt.offsetY || (evt.pageY - this.imageCanvas.offsetTop);
    this.dragStart = this.imageCtx.transformedPoint(this.lastX, this.lastY);
    this.dragged = false;
  }

  mouseMoveHandler (evt) {
    this.dragged = true;
    this.lastX = evt.offsetX || (evt.pageX - this.imageCanvas.offsetLeft);
    this.lastY = evt.offsetY || (evt.pageY - this.imageCanvas.offsetTop);
    if (this.dragStart) {
      this.isCanvasHovered = false;
      if(this.measureToolLastPosition && ( this.dragStart.x >= this.measureToolLastPosition.x - this.measureToolLastPosition.radius && this.dragStart.x <= this.measureToolLastPosition.x + this.measureToolLastPosition.radius && this.dragStart.y >= this.measureToolLastPosition.y - this.measureToolLastPosition.radius && this.dragStart.y <= this.measureToolLastPosition.y + this.measureToolLastPosition.radius)){
        this.dragStart = this.imageCtx.transformedPoint(this.lastX, this.lastY);
        this.dragEnd = this.imageCtx.transformedPoint(this.lastX, this.lastY);
      }
      else{
        const pt = this.imageCtx.transformedPoint(this.lastX, this.lastY);
        this.imageCtx.translate(pt.x - this.dragStart.x, pt.y - this.dragStart.y);
      }
      this.redraw();
    }
    else{
      this.rollOverZoom();
    }
  }

  rollOverZoom(){
    if(this.rollOverZoomFlag && this.imageCtx && this.fullImageCtx){
      this.redraw();
      const points = [];
      this.isCanvasHovered = true;
      this.imageCtx.strokeStyle = '#a83537';
      const pt = this.imageCtx.transformedPoint(this.lastX, this.lastY)
      const x = pt.x;
      const y = pt.y;
      const width = 40;
      const height = 40;
      //const scaledWidth = this.totalScaleFactor*width;
      //const scaledHeight = this.totalScaleFactor*height;
      points.push([x - width / 2, y - height / 2]);
      points.push([x + width / 2, y - height / 2]);
      points.push([x + width / 2, y + height / 2]);
      points.push([x - width / 2, y + height / 2]);
      const num_points = points.length;
      this.imageCtx.beginPath();
      this.imageCtx.moveTo(points[num_points - 1][0], points[num_points - 1][1]);
      for (let j = 0; j < num_points; j++) {
        this.imageCtx.lineTo(points[j][0], points[j][1]);
      }
      const widthRatio = this.image.width / this.imageCanvas.width;
      const heightRatio = this.image.height / this.imageCanvas.height;
      let imgData = this.fullImageCtx.getImageData(points[0][0]*widthRatio, points[0][1]*heightRatio, width*widthRatio, height*heightRatio);
      this.imageCtx.closePath();
      this.imageCtx.fillStyle = "rgba(0,0,0,0.2)";
      this.imageCtx.setLineDash([3, 6]);
      this.imageCtx.fill();
      this.imageCtx.stroke();


      let imgClip = document.getElementById('img-clip');
      if(imgClip) {
        imgClip.innerHTML = "";
      }
      let canvas1 = document.createElement("canvas");
      canvas1.width = width*widthRatio;
      canvas1.height = height*heightRatio;
      let ctx1 = canvas1.getContext("2d");
      ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
      //ctx1.rect(0, 0, canvas1.width, canvas1.height);
      ctx1.putImageData(imgData, 0, 0);
      ctx1.drawImage(canvas1, 0 , 0);

      if(imgClip) {
        imgClip.append(canvas1);
      }
    }
  }

  mouseUpHandler (evt) {
    this.dragStart = null;
    if (!this.dragged) {
      this.zoom(evt.shiftKey ? -1 : 1);
    }
  }

  loadImage () {
    this.updateLoaderDisplay(true);
    this.totalZoomPerc = this.startingZoomPerc;
    this.image = new Image();
    this.image.crossOrigin = "Anonymous";
    this.image.onload = this.imageLoadHandler;
    this.image.onerror = function () {
      this.showError = true;
    };
    if (this.imageCanvas && this.isEventResponsive) {
      this.imageCanvas.removeEventListener('mousedown', this.mouseDownHandler, false);
      this.imageCanvas.removeEventListener('mouseup', this.mouseUpHandler, false);
    }
    this.image.src = this.imageSource;
    this.image.crossOrigin = "Anonymous";
  };

  onPointerCanvasExit() {
    this.dragStart = null;
    this.isCanvasHovered = false;
    this.redraw(); //To remove mouse pointer zoom patch
  }

  updateLoaderDisplay(isSpinner) {
    this.isSpinner = isSpinner;
    if (!this.cdr['destroyed']) {
      this.cdr.detectChanges();
    }
  }

  openMeasureTool(){
    if(this.isMeasureToolOpen){
      return;
    }
    this.isMeasureToolOpen = true;
    this.fixedRange = [];
    for(let i=this.measureToolMinLength; i<=this.measureToolMaxLength; i++){
      if(i % 5 === 0){
        this.fixedRange.push(i);
      }
    }
    this.addTool('line', this.measureValue);
  }

  closeMeasureTool(){
    this.isMeasureToolOpen = false;
    this.isCircleMeasureToolSelected = false;
    this.isLineMeasureToolSelected = false;
    this.rollOverZoomFlag = true;
    this.dragEnd = null;
    this.rotateBy = 0;
    this.measureValue = 7;
    this.redraw();
  }

  editTool(value = 7){
    this.measureValue = value;
    this.redraw();
  }

  addTool(tool : string, value = 7, zoom = true){
    this.measureValue = value;
    if(tool === "circle"){
      // draw a circle
      if(this.isLineMeasureToolSelected){
        this.isLineMeasureToolSelected = false;
        this.redraw();
      }
      if(!this.isCircleMeasureToolSelected){
        if(zoom){
          this.onZoomOptionSelect(100)
        }
        this.addCircle();
      }
    }
    else if(tool === "line"){
      if(this.isCircleMeasureToolSelected){
        this.isCircleMeasureToolSelected = false;
        this.redraw();
      }
      if(!this.isLineMeasureToolSelected){
        if(zoom){
          this.onZoomOptionSelect(100)
        }
        this.addLine()
      }
    }
  }

  addCircle(){
    this.isCircleMeasureToolSelected = true;
    this.toolSelected = "Circle";
    this.rollOverZoomFlag = false;
    const widthRatio = this.image.width / this.imageCanvas.width;
    const heightRatio = this.image.height / this.imageCanvas.height;
    
    this.imageCtx = this.imageCanvas.getContext('2d');
    const diameter = this.measureValue * this.fovPpm / widthRatio;
    const radius = diameter / 2;
    this.imageCtx.strokeStyle = '#000000';
    this.imageCtx.setLineDash([]);
    const x_center = this.image.width / 2;
    const y_center = this.image.height / 2;
    let x = this.dragEnd && this.dragEnd.x || x_center / widthRatio;
    let y = this.dragEnd && this.dragEnd.y || y_center / heightRatio;
    this.measureToolLastPosition.x = x;
    this.measureToolLastPosition.y = y;
    this.measureToolLastPosition.radius = radius;
    this.imageCtx.beginPath();
    const gapBetweenTextAndTool = (radius + (5 * this.fovPpm / widthRatio ))
    const text = this.measureValue + " \u00B5"+"m";
    this.imageCtx.font = (diameter / 1.5) +'px' + ' Lato';
    this.imageCtx.arc(x, y, radius , 0, 2 * Math.PI, true);
    this.imageCtx.lineWidth = 1
    this.imageCtx.stroke();
    this.drawTextWithBG(this.imageCtx, text, diameter, x - diameter, y - gapBetweenTextAndTool)
  }

  addLine(){
    this.isLineMeasureToolSelected = true;
    this.toolSelected = "Line";
    this.rollOverZoomFlag = false;
    const widthRatio = this.image.width / this.imageCanvas.width;
    const heightRatio = this.image.height / this.imageCanvas.height;
    this.imageCtx = this.imageCanvas.getContext('2d');
    const radius = this.measureValue * this.fovPpm / widthRatio;
    this.imageCtx.strokeStyle = '#000000';

    const x_center = this.image.width / 2;
    const y_center = this.image.height / 2;
    let x = this.dragEnd && this.dragEnd.x || x_center / widthRatio;
    let y = this.dragEnd && this.dragEnd.y || y_center / heightRatio;
    
    const startX = x;
    const startY = y;

    const angleInRadians = this.rotateBy * Math.PI / 180;

    // Calculate the coordinates of the final point
    const endX = startX + radius * Math.cos(angleInRadians);
    const endY = startY + radius * Math.sin(angleInRadians);
    this.measureToolLastPosition.x = startX + (radius / 2) * Math.cos(angleInRadians);
    this.measureToolLastPosition.y = startY + (radius / 2) * Math.sin(angleInRadians);
    this.measureToolLastPosition.radius = (radius / 2);

    this.imageCtx.beginPath();
    const gapBetweenTextAndTool = ((radius / 2) + (5 * this.fovPpm / widthRatio )) + (endY <= startY ? startY - endY : 0 )
    const text = this.measureValue + " \u00B5"+"m";
    this.imageCtx.font = (radius / 1.5) +'px' + ' Lato';
    
    this.imageCtx.moveTo(startX, startY)
    this.imageCtx.lineTo( endX, endY)
    this.imageCtx.stroke();
    
    this.imageCtx.beginPath();
    this.imageCtx.arc(startX, startY, radius / 10 , 0, 2 * Math.PI, true);
    this.imageCtx.fillStyle = '#fff';
    this.imageCtx.fill()
    this.imageCtx.stroke();
    this.imageCtx.beginPath();
    
    this.imageCtx.arc(endX, endY, radius / 10 , 0, 2 * Math.PI, true);
    this.imageCtx.fillStyle = '#fff';
    this.imageCtx.fill()
    this.imageCtx.stroke();
    
    this.drawTextWithBG(this.imageCtx, text, radius, x - radius, y - gapBetweenTextAndTool)
  }

  // If you omit the last three params, it will draw a rectangle
  // outline with a 5 pixel border radius
  // @param {CanvasRenderingContext2D} ctx
  // @param {Number} x The top left x coordinate
  // @param {Number} y The top left y coordinate
  // @param {Number} width The width of the rectangle
  // @param {Number} height The height of the rectangle
  // @param {Number} [radius = 5] The corner radius; It can also be an object
  //                to specify different radii for corners
  // @param {Number} [radius.tl = 0] Top left
  // @param {Number} [radius.tr = 0] Top right
  // @param {Number} [radius.br = 0] Bottom right
  // @param {Number} [radius.bl = 0] Bottom left
  // @param {Boolean} [fill = false] Whether to fill the rectangle.
  // @param {Boolean} [stroke = true] Whether to stroke the rectangle.
  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
      stroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
    radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
    var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }

  }

  drawTextWithBG(ctx, txt, font, x, y) {
      ctx.save();
      ctx.fillStyle = '#fff';
      var width = ctx.measureText(txt).width * 1.5;
      if(this.isCircleMeasureToolSelected){
        ctx.fillRect(x - (width / 10), y - (font / 1.3), width, parseInt(font, 10));
        ctx.fillStyle = '#000';
        ctx.fillText(txt, x +( width / 10), y);
      }
      else if(this.isLineMeasureToolSelected){
        ctx.fillRect(x + (width / 10) , y - (font / 1.5), width, parseInt(font, 10));
        ctx.fillStyle = '#000';
        ctx.fillText(txt, x + (width / 3), y);
      }
      ctx.restore();
  } 

}
