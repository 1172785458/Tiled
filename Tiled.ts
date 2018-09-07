import { TiledData, TiledJson } from "./TiledType";
import TiledLayer from "./TiledLayer";

/** 图块 */
export default class Tiled {

    /**
     * @author D-Team viva
     * @date   2018/08/31
     */

    /** 缓存资源分组标签 */
    static readonly TILED_RES_GROUP: string = 'tiledresgroup';

    private static _time: number = 0;
    /** 累计时间（ms） */
    static get timeCount(): number { return this._time; }
    static set timeCount(time: number) { this._time = time; }


    private static _scale: number = 1;
    /** 时间缩放比例 */
    static get timeScale(): number { return this._scale; }
    static set timeScale(scale: number) { this._scale = scale; }


    private static _paused: boolean = false;
    /** 暂停处理 */
    static paused(): void { this._paused = true; }
    /** 恢复处理 */
    static resume(): void { this._paused = false; }


    /** 解释配置数据
     * @param json   配置数据
     * @param clear  清空原有数据
     */
    static decode(json: TiledJson, clear: boolean = true): Tiled {
        clear && this.clear();
        for (let layerName in json) {
            this.create(layerName, json[layerName]);
        }
        return this;
    }
    /** 解释配置数据（来自JSON文件）
     * @param jsonFile  配置数据文件路径
     * @param clear     清空原有数据
     * @param complete  回调函数
     */
    static decodeFrom(jsonFile: string, clear: boolean = true, complete?: Function): void {
        let json = Laya.loader.getRes(jsonFile);
        if (json) {
            this.decode(json, clear);
            complete && complete();
        } else {
            Laya.loader.load(jsonFile, Laya.Handler.create(this, () => {
                this.decodeFrom(jsonFile, clear, complete);
            }), undefined, Laya.Loader.JSON);
        }
    }


    private static _data: Map<string, TiledData> = new Map();
    /** 添加并格式化数据 */
    static add(name: string, data: TiledData): TiledData {
        if (this._data.has(name)) return data;
        data.tiled.forEach(tiled => {
            tiled.index = 0;
            tiled.total = tiled.urls.length;
            tiled.frame = tiled.frame || 0;
        });
        this._data.set(name, data);
        return data;
    }
    /** 删除数据 */
    static cut(name: string): Tiled {
        if (this._data.has(name)) this._data.delete(name);
        return this;
    }
    /** 获取数据 */
    static get(name: string): TiledData { return this._data.get(name) as TiledData; }
    /** 创建/重新赋值图层数据配置和水平位置偏移比例系数
     * @param name    图层唯一名称
     * @param data    图层数据配置
     * @param update  同步刷新显示
     */
    static set(name: string, data: TiledData, update: boolean = false): TiledLayer {
        this.cut(name);
        let d = this.add(name, data);
        let tl = this.create(name, data);
        tl.reset(d, update);
        return tl;
    }


    /** 缓存图块资源 */
    static cache(complete?: Function): void {
        let files: string[] = [];
        this._data.forEach(td => {
            td.tiled.forEach(tm => {
                tm.urls.forEach(s => {
                    if (files.indexOf(s) < 0) files.push(s);
                });
            });
        });
        Laya.loader.load(files, Laya.Handler.create(this, () => {
            complete && complete();
        }));
    }


    private static _layer: Map<string, TiledLayer> = new Map();
    /** 获取图层对象 */
    static getLayer(name: string): TiledLayer { return this._layer.get(name) as TiledLayer; }
    /** 创建图层
     * @param name  图层唯一名称
     * @param data  图层数据配置
     */
    static create(name: string, data: TiledData): TiledLayer {
        if (this._layer.has(name)) return this.getLayer(name);
        let d = this.add(name, data);
        let tl = new TiledLayer(d);
        this._layer.set(name, tl);
        return tl;
    }
    /** 销毁（所有）图层对象 */
    static remove(name?: string): Tiled {
        if (name) {
            let _tl = this.getLayer(name);
            if (_tl) {
                !_tl.destroyed && _tl.destroy();
                this._layer.delete(name);
            }
        } else {
            this._layer.forEach(tl => {
                !tl.destroyed && tl.destroy();
            });
            this._layer.clear();
        }
        return this;
    }


    /** 清空所有数据
     * @param cache  删除缓存数据
     */
    static clear(cache: boolean = false): Tiled {
        if (cache) Laya.loader.clearResByGroup(this.TILED_RES_GROUP);
        this._data.clear();
        this.remove();
        return this;
    }


    /** 刷新图层对象
     * @param x  刷新顶点X
     * @param y  刷新顶点Y
     */
    static update(x: number, y: number): void {
        if (this._paused) return;
        this.timeCount += Laya.timer.delta / this.timeScale;
        let keys: string[] = [];
        this._layer.forEach((tl: TiledLayer, key: string) => {
            if (tl.destroyed) {
                keys.push(key);
                return;
            }
            tl.play(this.timeCount);
            tl.draw(x, y);
        });
        keys.forEach(key => { this._layer.delete(key); });
    }

}