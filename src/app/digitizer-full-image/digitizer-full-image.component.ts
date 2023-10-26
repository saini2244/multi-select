import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { ReportService } from 'src/app/core/http/services';
import { Router } from '@angular/router';
import { GrowlService } from 'ngx-growl';
import { MAT_DIALOG_DATA } from '@angular/material';
import { GoogleAnalyticsContent } from 'src/app/shared/services/google-analytics.content';
import { DigitizerService } from '../../services/digitizer.service';
import { NeighborFovs } from 'src/app/features/list-reports/models/neighborFovs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommentsService } from 'src/app/core/http/services';
import { UtilsHelperService } from 'src/app/shared/services/utils-helper.service';
import { KEY_CODE } from 'src/app/shared/utils/enumerator';

@Component({
  selector: 'app-digitizer-full-image',
  templateUrl: './digitizer-full-image.component.html',
  styleUrls: ['./digitizer-full-image.component.scss']
})


export class DigitizerFullImageComponent implements OnInit {
  sampleId: any;
  fov: any;
  lastX: any;
  comment = "";
  fovId: any;
  lastY: any;
  dragStart: any;
  dragged: any;
  imageCanvas: any;
  imageCtx: any;
  imageUrl: any;
  imageEle: any;
  scaleFactor: any = 1.104;
  zoomLevel = 7;
  totalScaleFactor: any = 1;
  showImage = false;
  showShortcutModel = false;
  showUp;
  showRight;
  showLeft;
  showDown;
  mode;
  math = Math;
  moveToCenter = false;
  hasEditAccess = false;
  form: FormGroup;
  commentSectionEnabled: boolean = false;
  formSubmitAttempt: boolean;
  isPostButtonDisabled = true;
  panSetIntervalId: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private reportsService: ReportService,
    private digitizerService: DigitizerService,
    private fb: FormBuilder,
    private router: Router,
    private growlService: GrowlService,
    private commentsService: CommentsService,
    private googleAnalyticsContent: GoogleAnalyticsContent) {
    this.fov = data.fov;
    this.sampleId = data.sampleId;
    this.digitizerService.sampleId = this.sampleId;
    this.mode = data.mode;
    this.digitizerService.neighborFovsChanged.subscribe((neighborFov: NeighborFovs) => {
      this.showUp = neighborFov.showUp;
      this.showDown = neighborFov.showDown;
      this.showLeft = neighborFov.showLeft;
      this.showRight = neighborFov.showRight;
    });
    this.digitizerService.activeFovChanged.subscribe((activeFov) => {
      this.fov = activeFov;
      this.fovId = this.fov.img_id;
      this.imageUrl = this.fov.url;
      this.imageEle.src = this.imageUrl;
    });
  }

  ngOnInit() {
    this.showImage = false;
    this.imageEle = new Image();
    this.imageEle.onload = () => {this.onLoadImg();};
    this.updateImgUrl();
    this.updateNavigators();
    this.hasEditAccess = this.data.reviewerId === UtilsHelperService.getDictFromSessionStorage('user')._id;
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {

    const { keyCode, shiftKey } = event;
    const { RIGHT_ARROW, LEFT_ARROW, UP_ARROW, DOWN_ARROW } = KEY_CODE;

    switch (true) {
      case keyCode === RIGHT_ARROW:
        if (!shiftKey) {
          this.panRight();
        } else if (this.showRight && this.showRight.url) {
          this.loadNext('right');
        }
        break;
      case keyCode === LEFT_ARROW:
        if (!shiftKey) {
          this.panLeft();
        } else if (this.showLeft && this.showLeft.url) {
          this.loadNext('left');
        }
        break;
      case keyCode === UP_ARROW:
        if (!shiftKey) {
          this.panTop();
        } else if (this.showUp && this.showUp.url) {
          this.loadNext('up');
        }
        break;
      case keyCode === DOWN_ARROW:
        if (!shiftKey) {
          this.panBottom();
        } else if (this.showDown && this.showDown.url) {
          this.loadNext('down');
        }
        break;
    }
  }

  updateImgUrl() {
    if (this.fov.url) {
      this.imageUrl = this.fov.url;
      this.imageEle.src = this.imageUrl;
      this.showImage = true;
    } else {
      this.reportsService.getPatchSource(this.sampleId, this.fov.name, this.fov.path, "").subscribe(data => {
        this.fov.url = data;
        this.imageUrl = this.fov.url;
        this.imageEle.src = this.imageUrl;
        this.showImage = true;
      });
    }

    if (this.fov.img_id) {
      this.fovId = this.fov.img_id;
    }
  }

  openShortcutsModal() {
    this.showShortcutModel = true;
  }

  closeShortcutsModal() {
    this.showShortcutModel = false;
  }

  loadNext(direction) {
    this.digitizerService.loadNextFov(direction);
    this.digitizerService.updateNavigators();
  }

  disableCommentBox(event) {
    this.commentSectionEnabled = false;
  }

  panRight() {
    this.lastX = this.lastX + 2;
    this.imageCtx.translate(2, 0);
    this.redraw();
  }

  panLeft() {
    this.lastX = this.lastX - 2;
    this.imageCtx.translate(-2, 0);
    this.redraw();
  }

  panTop() {
    this.lastY = this.lastY - 2;
    this.imageCtx.translate(0, -2);
    this.redraw();
  }

  startPanImage(action) {
    this.panSetIntervalId = setInterval(function() {
      action = action.bind(this);
      action();
    }.bind(this), 50);
  }

  stopPanImage() {
    window.clearInterval(this.panSetIntervalId);
  }

  panBottom() {
    this.lastY = this.lastY + 2;
    this.imageCtx.translate(0, 2);
    this.redraw();
  }

  enableCommentBox(isEnabled) {
    this.commentSectionEnabled = true;
    this.isPostButtonDisabled = !isEnabled;
    this.form = this.fb.group({
      description: [{ value: '', disabled: !isEnabled }, Validators.required,]
    });
  }

  onSubmit() {
    this.isPostButtonDisabled = true;
    const obj = {
      description: this.form.value.description,
      section: this.fovId,
      analysis: this.data.sampleId,
      updt_ts: Date.now(),
      template_section: undefined,
    };

    if (obj.description === '' || obj.description === null) {
      this.growlService.addError({
        heading: 'Oops!',
        message: 'Please enter your comment'
      });
      this.isPostButtonDisabled = false;
    } else {
      this.commentsService
        .postComments(obj)
        .subscribe(() => {
          this.growlService.addSuccess({
            heading: 'Success',
            message: 'Comment data added successfully.'
          });
          this.reportsService.setcommentPosted(true);
          this.comment = "";
          this.form.reset();
          for (const i in this.form.controls) {
            if (this.form.controls.hasOwnProperty(i)) {
              this.form.controls[i].setErrors(null);
            }
          }
          this.isPostButtonDisabled = false;
        });
    }
    this.googleAnalyticsContent.emitEvent(this.googleAnalyticsContent.eventMap.COMPONENT_COMMENT_ADD);
  }

  updateNavigators() {
    this.digitizerService.updateNavigators();
  }

  isFieldInvalid(field: string) {
    return (
      (!this.form.get(field).valid && this.form.get(field).touched) ||
      (this.form.get(field).untouched && this.formSubmitAttempt)
    );
  }

  zoom(clicks) {
    const pt = this.imageCtx.transformedPoint(this.lastX, this.lastY);
    this.imageCtx.translate(pt.x, pt.y);
    const factor = Math.pow(this.scaleFactor, clicks);
    this.totalScaleFactor = factor * this.totalScaleFactor;
    this.imageCtx.scale(factor, factor);
    this.imageCtx.translate(-pt.x, -pt.y);
    this.redraw();
    this.googleAnalyticsContent.emitEvent(this.googleAnalyticsContent.eventMap.DIGITIZER_FOV_ZOOM);
  }

  zoomToCenter = (clicks) => {
    this.lastX = this.imageCanvas.width / 2;
    this.lastY = this.imageCanvas.height / 2;
    this.zoom(clicks);
  }

  resize() {
    const transforms = this.imageCtx.getTransform();
    this.imageCtx.scale(1 / transforms.a, 1 / transforms.d);
    this.imageCtx.translate(-transforms.e, -transforms.f);
    this.lastX = this.imageCanvas.width / 2;
    this.lastY = this.imageCanvas.height / 2;
    this.zoom(this.zoomLevel);
  };

  redraw() {
    const p1 = this.imageCtx.transformedPoint(0, 0);
    const p2 = this.imageCtx.transformedPoint(this.imageCanvas.width, this.imageCanvas.height);
    // if (this.moveToCenter) {
    //   this.moveToCenter = false;
    //   this.imageCtx.translate(-p2.x, -p2.y);
    // }
    this.imageCtx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    this.imageCtx.save();
    this.imageCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
    this.imageCtx.restore();

    this.imageCtx.drawImage(this.imageEle, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
    this.drawRectangleOnVPOfImg();
  }

  trackTransforms(ctx) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    let xform = svg.createSVGMatrix();
    ctx.getTransform = () => { return xform; };

    const savedTransforms = [];
    const save = ctx.save;
    ctx.save = () => {
      savedTransforms.push(xform.translate(0, 0));
      return save.call(ctx);
    };
    const restore = ctx.restore;
    ctx.restore = () => {
      xform = savedTransforms.pop();
      return restore.call(ctx);
    };

    const scale = ctx.scale;
    ctx.scale = (sx, sy) => {
      xform = xform['scaleNonUniform'](sx, sy);
      return scale.call(ctx, sx, sy);
    };
    const rotate = ctx.rotate;
    ctx.rotate = (radians) => {
      xform = xform.rotate(radians * 180 / Math.PI);
      return rotate.call(ctx, radians);
    };
    const translate = ctx.translate;
    ctx.translate = (dx, dy) => {
      xform = xform.translate(dx, dy);
      return translate.call(ctx, dx, dy);
    };
    const transform = ctx.transform;
    ctx.transform = (a, b, c, d, e, f) => {
      const m2 = svg.createSVGMatrix();
      m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
      xform = xform.multiply(m2);
      return transform.call(ctx, a, b, c, d, e, f);
    };
    const setTransform = ctx.setTransform;
    ctx.setTransform = (a, b, c, d, e, f) => {
      xform.a = a;
      xform.b = b;
      xform.c = c;
      xform.d = d;
      xform.e = e;
      xform.f = f;
      return setTransform.call(ctx, a, b, c, d, e, f);
    };
    const pt = svg.createSVGPoint();
    ctx.transformedPoint = (x, y) => {
      pt.x = x; pt.y = y;
      return pt.matrixTransform(xform.inverse());
    };
  };

  drawRectangleOnVPOfImg() {
    const ratio = this.getAspectRatio(this.imageEle.height, this.imageEle.width);
    const smallImageWidth = 150;
    const smallImageHeight = ( smallImageWidth * ratio );
    const smallImage = document.getElementById("smallImage");
    smallImage.style.height = smallImageHeight + "px";
    smallImage.style.width = smallImageWidth + "px";
    const imageWidth = this.imageCanvas.width;
    const imageHeight = this.imageCanvas.height;

    const topLeftPt = this.imageCtx.transformedPoint(0, 0);
    const bottomRightPt = this.imageCtx.transformedPoint(imageWidth, imageHeight);

    let offSetLeft = topLeftPt.x / imageWidth * smallImageWidth;
    let offSetTop = topLeftPt.y / imageHeight * smallImageHeight
    let offSetRight = bottomRightPt.x / imageWidth * smallImageWidth
    let offSetBottom = bottomRightPt.y / imageHeight * smallImageHeight

    offSetLeft = offSetLeft < 0 ? 0 : offSetLeft;
    offSetTop = offSetTop < 0 ? 0 : offSetTop;
    offSetRight = offSetRight <= smallImageWidth ? offSetRight : smallImageWidth;
    offSetBottom = offSetBottom <= smallImageHeight ? offSetBottom : smallImageHeight;

    const rectWidth = offSetRight - offSetLeft <= 0 ? 0.0001 : offSetRight - offSetLeft;
    const rectHeight = offSetBottom - offSetTop <= 0 ? 0.0001 : offSetBottom - offSetTop;

    const smallImageConvas: any = document.getElementById("imageCanvas");
    const smallImagectx = smallImageConvas.getContext("2d");
    smallImageConvas.width = smallImageWidth;
    smallImageConvas.height = smallImageHeight;

    // draw rectangle
    smallImagectx.clearRect(0, 0, 300, 300);
    smallImagectx.restore();
    smallImagectx.beginPath();
    smallImagectx.lineWidth = "5";
    smallImagectx.strokeStyle = "#a83537";
    smallImagectx.rect(offSetLeft, offSetTop, rectWidth, rectHeight);
    smallImagectx.stroke();
  }

  getAspectRatio(height, width) {
    return height/width
  }

  onLoadImg() {
    this.zoomLevel = 7;
    this.totalScaleFactor = 1;
    if (this.fov) {
      this.showImage = true;

      this.imageCanvas = document.getElementById('fovCanvas');
      this.imageCanvas.addEventListener('DOMMouseScroll', this.handleScroll, false);
      this.imageCanvas.addEventListener('mousewheel', this.handleScroll, false);
      this.imageCanvas.addEventListener('mousedown', this.handleMouseDown, false);
      this.imageCanvas.addEventListener('mousemove', this.handleMouseMove, false);
      this.imageCanvas.addEventListener('mouseup', this.handleMouseUp, false);
      this.imageCanvas.addEventListener('mouseleave', this.onPointerCanvasExit.bind(this), false);
      document.addEventListener('mouseleave', this.onPointerCanvasExit.bind(this), false);

      this.imageCtx = this.imageCanvas.getContext('2d');
      this.trackTransforms(this.imageCtx);
      const ratio = this.getAspectRatio(this.imageEle.height, this.imageEle.width);
      const canvasStyle = getComputedStyle(this.imageCanvas);
      this.imageCanvas.height = parseInt(canvasStyle.getPropertyValue('height'), 10);
      this.imageCanvas.width = this.imageCanvas.height / ratio;
      // this.moveToCenter = true;
      this.lastY = this.imageCanvas.height /  2;
      this.lastX = this.imageCanvas.width /  2;
      this.zoom(this.zoomLevel);
    }
    this.imageEle.onerror = () => {
      // this.showError = true;
    };
  };

  handleScroll = (event) => {
    const delta = event.wheelDelta ? event.wheelDelta / 40 :
      event.detail ? -event.detail : 0;
    if (delta) {
      this.zoomLevel = this.zoomLevel + delta;
      this.zoom(delta);
    }
    return event.preventDefault() && false;
  }

  handleMouseDown = (event) => {
    document.body.style['mozUserSelect'] = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
    this.lastX = event.offsetX || (event.pageX - this.imageCanvas.offsetLeft);
    this.lastY = event.offsetY || (event.pageY - this.imageCanvas.offsetTop);
    this.dragStart = this.imageCtx.transformedPoint(this.lastX, this.lastY);
    this.dragged = false;
  }

  handleMouseMove = (event) => {
    this.dragged = true;
    if (this.dragStart) {
      const pt = this.imageCtx.transformedPoint(this.lastX, this.lastY);
      this.imageCtx.translate(pt.x - this.dragStart.x, pt.y - this.dragStart.y);
      this.lastX = event.offsetX || (event.pageX - this.imageCanvas.offsetLeft);
      this.lastY = event.offsetY || (event.pageY - this.imageCanvas.offsetTop);
      this.redraw();
    }
  }


  handleMouseUp = (event) => {
    this.dragStart = null;
    if (!this.dragged) {
      const delta = event.shiftKey ? -1 : 1;
      this.zoomLevel = this.zoomLevel + delta;
      this.zoom(delta);
    }
  }

  resetZoom() {
    this.zoomLevel = 7;
    this.totalScaleFactor = 1;
    this.moveToCenter = true;
    this.resize();
  };

  btnZoom(delta) {
    this.zoomLevel = this.zoomLevel + delta;
    this.zoom(delta);
  }

  onPointerCanvasExit() {
    this.dragStart = null;
  }

}
