/**
 * @author D-Team viva
 * @date   2018/08/31
 */

/** 位移系数 */
type TiledRatio = {
    /** 水平 */ x: number
    /** 垂直 */ y: number
}

/** 图块宽高 */
type TiledSize = {
    /** 宽度 */ width: number
    /** 高度 */ height: number
}

/** 图块配置二维数据 */
type TiledMap = {
    /** 当前帧 */ index: number
    /** 总帧数 */ total: number
    /** 起始帧 */ frame: number
    /** 帧间隔 */ interval: number
    /** 帧图像 */ urls: string[]
}

/** 自定义动作处理 */
type Action = {
    /** 标识符 */ type: string
    /** 参数集 */ [code: string]: any
}

/** 通过draw绘制的动画图块 */
type TiledAni = {
    /** 图块序号 */ idx: number
    /** 处理动作 */ action?: Action[]
} & TiledRatio

/** 通过addChild添加到图层的动画对象 */
type TiledSpr = {
    /** 透 明 度 */ alpha: number
    /** 旋转角度 */ rotation: number
    /** 横向缩放 */ scaleX: number
    /** 紧身缩放 */ scaleY: number
    /** 水平锚点 */ pivotX: number
    /** 垂直锚点 */ pivotY: number
    /** 循环播放 */ loop: boolean
    /** 混合模式 */ blend: boolean
} & TiledAni

/** 图层配置数据 */
type TiledData = {
    /** 图层景深 */ zOder: number
    /** 位移系数 */ ratio: TiledRatio
    /** 图块宽高 */ size: TiledSize
    /** 图块配置 */ tiled: TiledMap[]
    /** 图块布局 */ layout: number[][]
    /** 动态图块 */ dynamic: TiledAni[]
    /** 动画对象 */ animation: TiledSpr[]
}

/** 图层列表数据 */
type TiledJson = {
    /** 图层配置数据 */ [layerName: string]: TiledData;
}

export { TiledRatio, TiledSize, TiledMap, Action, TiledAni, TiledSpr, TiledData, TiledJson }
