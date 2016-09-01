import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Dialog from './components/Dialog';
import assign from 'object-assign';

let cache = [];
const IS_MOBILE = /(iPhone|iPod|Android|ios)/i.test(navigator.userAgent);

var addEventListerner = (function () {
  if (document.addEventListener) {
    return function (el, type, fn) {
      el.addEventListener(type, fn, false);
    };
  } else {
    return function (el, type, fn) {
      el.attachEvent('on' + type, function () {
        return fn.call(el, window.event);
      });
    }
  }
})();

class VDialog {
  constructor(config) {
    this.version = '1.0.0';
    this.options = assign({
      id: '',
      type: '',
      title: '提示信息',
      content: '',
      init: null,
      ok: null,
      okValue: '确定',
      cancel: null,
      cancelValue: '取消',
      modal: false,
      fixed: false,
      close: null,
      fire: !IS_MOBILE,
      esc: true,
      time: false,
      width: 'auto',
      height: 'auto',
      left: 'auto',
      top: 'auto',
      padding: 'auto',
      wrapClass: '',
      direction: 'rtl'
    }, config);
    this._eventQueue = {};
    this._visible = true;
    this.EventEmitter = {
      _events: {},
      dispatch: function (event, data) {
        if (!this._events[event]) {
          return;
        }
        for (var i = 0; i < this._events[event].length; i++) {
          this._events[event][i](data);
        }
      },
      subscribe: function (event, callback) {
        if (!this._events[event]) {
          this._events[event] = [];
        }
        this._events[event].push(callback);
      }
    };
    this._init();
  }

  _init() {
    var that = this;
    this.DOM = {};
    this.IS_MOBILE = IS_MOBILE;
    this._buttons = [];
    // 设置 ID
    if (!this.options.id) {
      this.options.id = Math.random();
    }
    // 创建 DOM
    this._build();
    // 标题
    this.title(this.options.title);
    // 图标
    this.type(this.options.type);

    // 确定按钮
    this.ok(this.options.ok);
    // 取消按钮
    this.cancel(this.options.cancel);
    // 关闭事件
    this.close(this.options.close);
    // 关闭按钮
    this.fire(this.options.fire);
    // 定时关闭
    this.time(this.options.time);
    // 尺寸
    this.width(this.options.width);
    this.height(this.options.height);
    this.padding(this.options.padding);
    // 随屏滚动
    this.fixed(this.options.fixed);
    // 内容，因为涉及到位置、尺寸计算，所以需要放到创建 DOM 之后
    this.content(this.options.content);
    // init
    this.init(this.options.init);
    // 模态窗口
    if (this.options.modal) {
      this.showModal();
    }
    addEventListerner(window, 'resize', () => this.position());
    return this;
  }

  init(fn) {
    this.options.init = fn;
    if (typeof fn === 'function') {
      this.options.init.call(this);
    }
    return this;
  }

  _build() {
    this.zIndex = ++VDialog._options.zIndex;
    this.wrap = document.createElement('div');
    document.body.appendChild(this.wrap);

    ReactDOM.render(
      <Dialog
        className={this.options.wrapClass || ''}
        dialog={this}
      />, this.wrap
    );

    cache.push({
      id: this.options.id,
      dialog: this
    });
    this._top();
    return this;
  }

  type(name) {
    if (typeof name === 'string') {
      // 设置图标
      this.options.type = name;
      this.EventEmitter.dispatch('type', name);
      return this;
    } else if (name === undefined) {
      // 读取图标
      return this.options.type;
    }
    return this;
  }

  title(title) {
    if (typeof title === 'boolean' || typeof title === 'string') {
      // 设置标题
      this.options.title = title;
      this.EventEmitter.dispatch('title', title);
      return this;
    } else if (title === undefined) {
      // 读取标题
      return this.options.title;
    }
  }

  content(content) {
    if (content === undefined) {
      // 读取内容
      return this.DOM.content;
    } else {
      // 设置内容
      this.options.content = content;
      this.EventEmitter.dispatch('content', content);
      this.position();
      return this;
    }
  }

  button(button, fn) {
    if (fn === true) {
      fn = function allowFn() {};
    } else if (fn === false) {
      fn = function denyFn() {
        return false;
      };
    }
    if(typeof button === 'string') {
      let currentButton = this._buttons.find(v => v.name === button);
      if(currentButton) {
        if(fn === 'undefined') {
          return currentButton;
        } else {
          currentButton.callback = fn;
          return this;
        }
      } else {
        button = {
          name: button,
        };
      }
    }
    if(typeof button === 'object') {
      let currentButton = this._buttons.find(v => v.name === button.name);
      let buttonOption = assign({
        name: '',
        className: 'ok',
        text: '确定',
        DOM: null,
        callback: () => {
          let returnValue = null, returnDom;
          returnDom = this.DOM.content.querySelector && this.DOM.content.querySelector('[data-returnable="true"]');
          if (returnDom) {
            returnValue = returnDom.val();
            this.returnValue = returnValue;
          }
          if (fn && fn.call(this) !== false) {
            this.close();
          }
        }
      }, button);
      if(button.name === 'ok') {
        assign(buttonOption, {
          className: 'ok',
          text: this.options.okValue || '确定',
        });
      } else if(button.name === 'cancel') {
        assign(buttonOption, {
          className: 'cancel',
          text: this.options.cancelValue || '取消',
        });
      }
      if(currentButton && currentButton.name === buttonOption.name) {
        assign(currentButton, buttonOption);
      } else {
        this._buttons.push(buttonOption);
      }
      this.EventEmitter.dispatch('buttons');
      return this;
    }
  }

  ok(fn) {
    return this.button('ok', fn);
  }

  cancel(fn) {
    return this.button('cancel', fn);
  }

  fire(fn) {
    if (fn !== undefined) {
      this.options.fire = fn;
      this.EventEmitter.dispatch('fire');
    } else {
      if(typeof this.options.fire === 'function') {
        this.options.fire.call(this);
      }
    }
    return this;
  }

  close(fn) {
    if (fn !== undefined) {
      this.options.close = fn;
      if(this.options.close === false) {
        this.options.fire = this.options.close;
        this.fire(this.options.fire);
      }
    } else {
      this.destroy();
      if (typeof this.options.close === 'function') {
        this.options.close.call(this);
      }
    }
    return this;
  }

  destroy() {
    const unmountResult = ReactDOM.unmountComponentAtNode(this.wrap);
    if (unmountResult) {
      this.wrap.parentNode.removeChild(this.wrap);
    }
    for (var i = 0; i < cache.length; i++) {
      if (cache[i].dialog === this) {
        cache.splice(i, 1);
        this._top();
        break;
      }
    }
    return this;
  }

  time(time) {
    if (typeof time === 'number') {
      this.options.time = time;
      setTimeout(() => {
        this.close();
      }, time * 1000);
    }
    return this;
  }

  width(width) {
    if (width === undefined) {
      return this.options.width;
    } else {
      this.options.width = width;
      this.EventEmitter.dispatch('width', this.options.width);
      this.position();
      return this;
    }
  }

  height(height) {
    if (height === undefined) {
      return this.options.height;
    } else {
      this.options.height = height;
      this.EventEmitter.dispatch('height', this.options.height);
      this.position();
      return this;
    }
  }

  padding(padding) {
    if (padding === undefined) {
      return this.options.padding;
    } else {
      this.options.padding = padding;
      this.EventEmitter.dispatch('padding', this.options.padding);
      this.position();
      return this;
    }
  }

  position() {
    this.EventEmitter.dispatch('position');
    return this;
  }

  fixed(fixed) {
    if (fixed === undefined) {
      return this.options.fixed;
    } else {
      this.options.fixed = !!fixed;
      this.EventEmitter.dispatch('fixed');
      this.position();
      return this;
    }
  }

  show(anchor) {
    this._visible = true;
    if (anchor) {
      let clientRect = anchor.getBoundingClientRect();
      this.options.left = clientRect.left + document.body.scrollLeft | document.documentElement.scrollLeft;
      this.options.top = clientRect.top + document.body.scrollTop | document.documentElement.scrollTop + clientRect.height;
      this.position();
    }
    this.EventEmitter.dispatch('visible');
    this._top();
    return this;
  }

  showModal(anchor) {
    this.options.modal = true;
    this.EventEmitter.dispatch('modal');
    this.show(anchor);
    return this;
  }

  hide() {
    this._visible = false;
    this.EventEmitter.dispatch('visible');
    this._top();
    return this;
  }

  _top() {
    vdialog.top = null;
    for (var i = cache.length - 1; i >= 0; i--) {
      if (cache[i].dialog._visible) {
        vdialog.top = cache[i].dialog;
        break;
      }
    }
    return this;
  }

  _esc() {
    return this;
  }

  on(name, fn) {
    if (fn) {
      if (this[name]) {
        this[name].call(this, fn);
      } else {
        // 自定义事件
        this._eventQueue[name] = fn;
      }
    }
    return this;
  }

  emit() {
    var name, args = Array.prototype.slice.call(arguments);
    if (args.length === 0) {
      return this;
    }
    name = args.shift();
    if (this._eventQueue[name]) {
      this._eventQueue[name].apply(this, args);
    }
    return this;
  }
}

// esc 键退出
addEventListerner(document, 'keydown', function(event) {
  var dialog = vdialog.top,
    target = event.srcElement ? event.srcElement : event.target;
  if (!dialog || /^input|textarea$/i.test(target.nodeName) && target.type !== 'button') {
    return;
  }
  if (event.keyCode === 27 && dialog.options.esc) {
    dialog.close();
  }
});

VDialog._options = {
  zIndex: 1000
};

/**
 * vdialog 实例
 * @method vdialog
 * @param  {Object} options 参数
 * @return {vdialog}
 */

function vdialog(options) {
  return new VDialog(options);
};
vdialog.top = null;
vdialog._proxy = vdialog;
vdialog.config = function(options) {
  assign(VDialog._options, options || {});
  return this;
};

/**
 * vdialog.alert
 * @method alert
 * @param  {String}   content 提示内容
 * @param  {Object}   options 对话框配置信息
 * @param  {Function} fn      关闭对话框时，执行的回调
 * @return {this}
 */
vdialog.alert = function(content, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  options = assign({
    type: mobile ? '' : 'alert',
    title: '提示信息',
    content: content,
    modal: true,
    fixed: true,
    fire: !mobile,
    ok: true,
    close: function() {
      fn && fn.call(this);
    }
  }, options);
  return this._proxy(options);
};

/**
 * vdialog.success
 * @method success
 * @param  {String}   content 成功提示内容
 * @param  {Object}   options 对话框配置信息
 * @param  {Function} fn      关闭对话框时，执行的回调
 * @return {this}
 */
vdialog.success = function(content, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  options = assign({
    type: mobile ? '' : 'success',
    title: '成功提示',
    content: content,
    modal: true,
    fixed: true,
    fire: !mobile,
    ok: true,
    close: function() {
      fn && fn.call(this);
    }
  }, options);
  return this._proxy(options);
};

/**
 * vdialog.error
 * @method error
 * @param  {String}   content 错误提示内容
 * @param  {Object}   options 对话框配置信息
 * @param  {Function} fn      关闭对话框时，执行的回调
 * @return {this}
 */
vdialog.error = function(content, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  options = assign({
    type: mobile ? '' : 'error',
    title: '错误提示',
    content: content,
    modal: true,
    fixed: true,
    fire: !mobile,
    ok: true,
    close: function() {
      fn && fn.call(this);
    }
  }, options);
  return this._proxy(options);
};

/**
 * vdialog.confirm
 * @method confirm
 * @param  {String}   content 确认提示内容
 * @param  {Object}   options 对话框配置信息
 * @param  {Function} okFn      点击确定按钮时，执行的回调
 * @param  {Function} cancelFn      点击取消按钮时，执行的回调
 * @return {this}
 */
vdialog.confirm = function(content, options, okFn, cancelFn) {
  if (typeof options === 'function') {
    cancelFn = okFn;
    okFn = options;
    options = {};
  }
  options = assign({
    type: mobile ? '' : 'confirm',
    title: '确认信息',
    content: content,
    modal: true,
    fixed: true,
    fire: !mobile,
    ok: function() {
      okFn && okFn.call(this);
    },
    cancel: function() {
      cancelFn && cancelFn.call(this);
    }
  }, options);
  return this._proxy(options);
};

/**
 * vdialog.loading
 * @method loading
 * @param  {String}   content 提示内容
 * @param  {Object}   options 对话框配置信息
 * @param  {Function} fn      关闭对话框时，执行的回调
 * @return {this}
 */
vdialog.loading = function(content, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  options = assign({
    type: 'toast-loading',
    wrapClass: 'vdialog-toast',
    title: false,
    content: content,
    modal: false,
    fixed: true,
    fire: !mobile,
    close: function() {
      fn && fn.call(this);
    }
  }, options);
  return this._proxy(options);
};

/**
 * vdialog.toast
 * @method toast
 * @param  {String}   content 提示内容
 * @param  {Object}   options 对话框配置信息
 * @param  {Function} fn      关闭对话框时，执行的回调
 * @return {this}
 */
vdialog.toast = function(content, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  options = assign({
    type: 'toast-success',
    wrapClass: 'vdialog-toast',
    title: false,
    content: content,
    modal: false,
    fixed: true,
    fire: !mobile,
    close: function() {
      fn && fn.call(this);
    }
  }, options);
  return this._proxy(options);
};

export default vdialog;