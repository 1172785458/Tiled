import { TiledAni, TiledData, TiledMap, TiledSpr } from "./TiledType";
import Tiled from "./Tiled";

/** 图块图层 */
export default class TiledLayer extends Laya.Sprite {

    /**
     * @author D-Team viva
     * @date   2018/08/31
     */

    /** 画布宽高 */
    private readonly WIDTH: number = Laya.stage.designWidth;
    private readonly HEIGHT: number = Laya.stage.designHeight;

    /** 图层数据配置 */
    private _tiledata!: TiledData;
    /** 记录绘制区域 */
    private _viewrect: Laya.Rectangle;
    /** 当前视口区域（区域外对象将不被渲染） */
    private _viewport: Laya.Rectangle;
    /** 记录图像对象 */
    private _imagelist: Laya.Image[] = [];

    /** 创建图块图层对象 */
    constructor(data?: TiledData) {
        super();

        this._viewrect = new Laya.Rectangle(0, 0, this.WIDTH, this.HEIGHT);
        this._viewport = this._viewrect.clone();
        this.viewport = this._viewport;

        data && this.reset(data, true);
    }

    /** 销毁处理 */
    destroy(): void {
        this._imagelist.forEach(img => img.destroy());
        this._imagelist.length = 0;
        delete this._imagelist;
        delete this._tiledata;
        delete this._viewrect;
        delete this._viewport;
        super.destroy();
    }

    /** 设置缩放比例 */
    scale(x: number, y: number): TiledLayer {
        super.scale(x, y);
        let port = this._viewport;
        port.width = this.WIDTH / x;
        port.height = this.HEIGHT / y;
        return this;
    }

    /** 重新赋值
     * @param data      图层数据配置
     * @param redraw    同步刷新显示
     */
    reset(data: TiledData, redraw: boolean = false): void {
        this._tiledata = data;
        this.zOrder = data.zOder;
        this.updateZOrder();
        if (redraw) {
            let rect = this._viewrect;
            this.draw(rect.x, rect.y);
        }
    }

    /** 重新赋值显示区域 */
    viewrect(x?: number | Laya.Rectangle, y?: number, width?: number, height?: number): void {
        if (x && (x instanceof Laya.Rectangle)) {
            this.viewrect(x.x, x.y, x.width, x.height);
            return;
        }
        let rect = this._viewrect;
        let ratio = this._tiledata.ratio;
        if (x !== undefined) rect.x = Math.floor(x * ratio.x);
        if (y !== undefined) rect.y = Math.floor(y * ratio.y);
        if (width !== undefined) rect.width = width;
        if (height !== undefined) rect.height = height;
    }

    /** 动画播放处理
     * @param timeCount 时间戳（单位：ms）
     */
    play(timeCount: number): void {
        let data = this._tiledata;
        data.tiled.forEach(tiled => {
            if (tiled.total < 2) return;
            let max: number = Math.floor(timeCount / tiled.interval);
            tiled.index = max % tiled.total;
        });
    }

    /** 绘制指定区域 */
    draw(x: number = 0, y: number = 0, width?: number, height?: number): void {
        let _rect = this._viewrect;
        let _size = this._tiledata.size;
        let _width: number = width || _rect.width;
        let _height: number = height || _rect.height;
        let _column: number = Math.floor(x / _size.width);
        let _line: number = Math.floor(y / _size.height);
        let _columnMax: number = Math.ceil((x + _width) / _size.width);
        let _lineMax: number = Math.ceil((y + _height) / _size.height);
        let _offsetX: number = -(x % _size.width);
        let _offsetY: number = -(y % _size.height);
        this.graphics.clear();
        this.drawMap(_column, _columnMax, _line, _lineMax, _offsetX, _offsetY);
        this.drawAni(x, y, _width, _height);
        this.drawSpr(x, y);
    }

    /** 获取图块当前帧 */
    private getIndex(tiled: TiledMap): number {
        return (tiled.index + tiled.frame) % tiled.total;
    }

    /** 获取图块文件路径 */
    private getUrl(tiled: TiledMap): string {
        let idx = this.getIndex(tiled);
        return tiled.urls[idx];
    }
    /** 通过索引获取图块文件路径 */
    private getUrlByIndex(index: number): string {
        return this.getUrl(this._tiledata.tiled[index]);
    }

    /** 获取图块资源纹理 */
    private getTexture(tiled: TiledMap, callback: (tex: Laya.Texture) => void): void {
        let url = this.getUrl(tiled);
        let tex: Laya.Texture = Laya.loader.getRes(url);
        if (tex) {
            callback(tex);
        } else {
            Laya.loader.load(url, Laya.Handler.create(this, callback), undefined, Laya.Loader.IMAGE, 1, true, Tiled.TILED_RES_GROUP, false);
        }
    }
    /** 通过索引获取图块资源纹理 */
    private getTextureByIndex(index: number, callback: (tex: Laya.Texture) => void): void {
        this.getTexture(this._tiledata.tiled[index], callback);
    }

    /** 绘制图块 */
    private drawTextures(map: Map<string, number[]>): void {
        map.forEach((pos: number[], url: string) => {
            let _tex: Laya.Texture = Laya.loader.getRes(url);
            _tex && this.graphics.drawTextures(_tex, pos);
        });
    }
    private drawMap(column: number, columnMax: number, line: number, lineMax: number, offsetX: number = 0, offsetY: number = 0): void {
        let _data: TiledData = this._tiledata;
        let _pnt: Map<string, number[]> = new Map();
        for (let i: number = line; i < lineMax; i++) {
            if (!_data.layout[i]) continue;
            for (let j: number = column; j < columnMax; j++) {
                if (!_data.layout[i][j]) continue;
                let _xy: number[] = [(j - column) * _data.size.width + offsetX, (i - line) * _data.size.height + offsetY];
                let _url: string = this.getUrlByIndex(_data.layout[i][j]);
                let _pos: number[] | undefined = _pnt.get(_url);
                if (_pos) {
                    _pos.push(..._xy);
                } else {
                    _pnt.set(_url, _xy);
                }
            }
        }
        this.drawTextures(_pnt);
    }
    private drawAni(x: number, y: number, width: number, height: number): void {
        let _data: TiledData = this._tiledata;
        let _pnt: Map<string, number[]> = new Map();
        let _ex: number = x + width;
        let _ey: number = y + height;
        let _min: number = 0;
        let _max: number = _data.dynamic.length;
        _data.dynamic.forEach((ani: TiledAni) => {
            if (ani.x >= _ex) return;
            if (ani.y >= _ey) return;
            this.getTextureByIndex(ani.idx, (tex: Laya.Texture) => {
                let _val: number = ani.x + tex.width;
                if (_val <= x) return;
                _val = ani.y + tex.height;
                if (_val <= y) return;
                let _xy: number[] = [ani.x, ani.y];
                let _url: string = this.getUrlByIndex(ani.idx);
                let _pos: number[] | undefined = _pnt.get(_url);
                if (_pos) {
                    _pos.push(..._xy);
                } else {
                    _pnt.set(_url, _xy);
                }
                //
                _min++;
                if (_min == _max) {
                    this.drawTextures(_pnt);
                }
            });
        });
    }
    private drawSpr(x: number, y: number): void {
        let _imgs = this._imagelist;
        let _data = this._tiledata;
        _data.animation.forEach((ani: TiledSpr, idx: number) => {
            let _img = _imgs[idx];
            if (!_img) {
                _img = new Laya.Image();
                _imgs[idx] = _img;
                this.addChild(_img);
            }
            _img.skin = this.getUrlByIndex(ani.idx);
            _img.alpha = isNaN(ani.alpha) ? 1 : ani.alpha;
            _img.pivot(ani.pivotX || 0, ani.pivotY || 0);
            _img.pos((ani.x || 0) - x, (ani.y || 0) - y);
            _img.rotation = ani.rotation || 0;
            _img.scale(isNaN(ani.scaleX) ? 1 : ani.scaleX, isNaN(ani.scaleY) ? 1 : ani.scaleY);
            _img.blendMode = ani.blend ? 'lighter' : '';
        });
    }

}