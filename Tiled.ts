import { TiledData } from "./TiledType";
import TiledLayer from "./TiledLayer";

/** 图块 */
export default class Tiled {

    /**
     * @author D-Team viva
     * @date   2018/08/31
     */

    /** 缓存资源分组标签 */
    static readonly RES_GROUP: string = 'tiledresgroup';

    /** 累计时间（ms） */
    static timeCount: number = 0;


    private static _paused: boolean = false;
    /** 暂停处理 */
    static paused(): void { this._paused = true; }
    /** 恢复处理 */
    static resume(): void { this._paused = false; }


    private static _data: Map<string, TiledData> = new Map();
    /** 格式化数据 */
    static format(data: TiledData, name: string): TiledData {
        if (this._data.has(name)) return data;
        data.tiled.forEach(tiled => {
            tiled.index = 0;
            tiled.total = tiled.urls.length;
            tiled.frame = tiled.frame || 0;
        });
        this._data.set(name, data);
        return data;
    }



    private static _layer: Map<string, TiledLayer> = new Map();
    /** 创建图层
     * @param data      图层数据配置
     * @param name      图层唯一名称
     * @param ratioX    水平位置偏移比例系数
     */
    static create(data: TiledData, name: string): TiledLayer {
        let _data: TiledData = this.format(data, name);
        let _tl: TiledLayer = new TiledLayer(_data);
        this._layer.set(name, _tl);
        return _tl;
    }
    /** 获取图层对象 */
    static get(name: string): TiledLayer | undefined {
        return this._layer.get(name);
    }
    /** 销毁（所有）图层对象 */
    static clear(name?: string): void {
        if (name) {
            let _tl: TiledLayer | undefined = this.get(name);
            if (_tl) {
                !_tl.destroyed && _tl.destroy();
                this._layer.delete(name);
            }
            return;
        }
        this._layer.forEach((tl: TiledLayer) => {
            !tl.destroyed && tl.destroy();
        });
        this._layer.clear();
    }


    /** 创建/重新赋值图层数据配置和水平位置偏移比例系数
     * @param name      图层唯一名称
     * @param data      图层数据配置
     * @param update    同步刷新显示
     */
    static set(name: string, data: TiledData, update?: boolean): TiledLayer {
        let _data: TiledData = data;
        let _tl: TiledLayer | undefined = this.get(name);
        if (_tl === undefined) {
            _tl = this.create(_data, name);
        } else {
            _data = this.format(data, name);
        }
        _tl.reset(_data, update);
        return _tl;
    }
    /** 为图层对象添加滤镜/滤镜集 */
    static filter(name: string, ...args: Laya.ColorFilter[]): void {
        let _tl: TiledLayer | undefined = this.get(name);
        _tl && (_tl.filters = args);
    }
    /** 设置图层对象透明度 */
    static alpha(name: string, alpha: number = 1): void {
        let _tl: TiledLayer | undefined = this.get(name);
        _tl && (_tl.alpha = alpha);
    }
    /** 显示/隐藏图层对象 */
    static visible(name: string, visible: boolean = true): void {
        let _tl: TiledLayer | undefined = this.get(name);
        _tl && (_tl.visible = visible);
    }
    /** 设置图层对象比例 */
    static scale(name: string, x: number = 1, y: number = 1): void {
        let _tl: TiledLayer | undefined = this.get(name);
        _tl && _tl.scale(x, y);
    }
    /** 绘制图层对象 */
    static draw(name: string, x: number, y: number, width: number, height: number): void {
        let _tl: TiledLayer | undefined = this.get(name);
        _tl && _tl.draw(x, y, width, height);
    }


    /** 刷新图层对象*/
    static update(x: number, y: number, width: number, height: number): void {
        if (this._paused) return;
        this.timeCount += Laya.timer.delta;
        this._layer.forEach((tl: TiledLayer) => {
            !tl.destroyed && tl.draw(x, y, width, height);
        });
    }
    // /** 刷新指定图层对象 */
    static updateBy(name: string, x: number, y: number, width: number, height: number): void {
        let _tl: TiledLayer | undefined = this.get(name);
        _tl && !_tl.destroyed && _tl.draw(x, y, width, height);
    }

}
