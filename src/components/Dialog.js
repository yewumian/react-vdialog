import * as React from 'react';
import assign from 'object-assign';

class Dialog extends React.Component {
  constructor(props) {
    super(props);
    let { options, _visible } = this.props.dialog;
    this.state = {
      title: options.title,
      left: options.left,
      top: options.top,
      padding: options.padding,
      fixed: options.fixed,
      modal: options.modal,
      visible: _visible,
    };
  }

  componentDidMount() {
    let dialog = this.props.dialog;
    let { EventEmitter, options } = dialog;
    EventEmitter.subscribe('title', title => {
      this.setState({
        title: title,
      });
    });
    EventEmitter.subscribe('padding', padding => {
      this.setState({
        padding: padding,
      });
    });
    EventEmitter.subscribe('fixed', () => {
      this.setState({
        fixed: options.fixed,
      });
    });
    EventEmitter.subscribe('position', () => {
      this.getPosition();
    });
    EventEmitter.subscribe('visible', () => {
      this.setState({
        visible: dialog._visible,
        modal: dialog._visible ? options.modal : false,
      });
    });
    EventEmitter.subscribe('modal', () => {
      this.setState({
        modal: options.modal,
      })
    });
  }

  getPosition() {
    let left, top, scrollSize, screenSize, dialogSize, el = document.documentElement || document.body;
    let { options, IS_MOBILE } = this.props.dialog;
    let wrap = this.refs.wrap;
    if(options.left === 'auto') {
      this.setState({
        left: 0,
      });
    }
    if (options.fixed) {
      scrollSize = {
        left: 0,
        top: 0,
      };
    } else {
      scrollSize = {
        left: window.pageXOffset || el.scrollLeft,
        top: window.pageYOffset || el.scrollTop
      };
    }
    screenSize = {
      width: el.clientWidth,
      height: el.clientHeight
    };
    dialogSize = {
      width: wrap.clientWidth,
      height: wrap.clientHeight,
    };
    if (options.left === 'auto') {
      left = scrollSize.left + Math.max(0, (screenSize.width - dialogSize.width) / 2);
    } else {
      left = options.left;
    }
    if (options.top === 'auto') {
      top = scrollSize.top + Math.max(10, (screenSize.height - dialogSize.height) / (IS_MOBILE ? 2 : 3));
    } else {
      top = options.top;
    }
    this.setState({
      left: left,
      top: top
    });
  }
  
  getModal() {
    let { zIndex } = this.props.dialog;
    return (
      <div className="vdialog-modal" style={{zIndex: zIndex - 1,}}></div>
    );
  }

  render() {
    let classNames = ['vdialog'];
    let dialog = this.props.dialog;
    let { IS_MOBILE, zIndex, wrapClass } = dialog;
    let styles = {
      zIndex: zIndex,
    };
    wrapClass && classNames.push(wrapClass);
    IS_MOBILE && classNames.push('vdialog-mobile');
    this.state.padding === 0 && classNames.push('vdialog-no-padding');
    this.state.fixed && classNames.push('vdialog-fixed');
    if(this.state.left) {
      styles.left = isNaN(this.state.left) ? this.state.left : (this.state.left + 'px');
    }
    if(this.state.top) {
      styles.top = isNaN(this.state.top) ? this.state.top : (this.state.top + 'px');
    }
    styles.display = this.state.visible ? 'block' : 'none';
    return (
      <div>
        { this.state.modal ? this.getModal() : null }
        <div ref="wrap" className={classNames.join(' ')} style={{...styles}}>
          <div className="vd-header">
            <Title dialog={dialog} />
            <Close dialog={dialog} />
          </div>
          <Main dialog={dialog}>
            <Content dialog={dialog} />
          </Main>
          <Footer dialog={dialog} />
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Dialog;

class Title extends React.Component {
  constructor(props) {
    super(props);
    let { options } = this.props.dialog;
    this.state = {
      title: options.title,
    };
  }

  componentDidMount() {
    var that = this;
    this.props.dialog.EventEmitter.subscribe('title', function(title) {
      that.setState({
        title: title,
      });
    });
  }

  render() {
    let classNames = ['vd-title'];
    let { title } = this.state;
    let titleString = '';
    if(title === false) {
      classNames.push('vdialog-no-title');
    } else if(typeof title === 'string') {
      titleString = title;
    }
    return (
      <div className={classNames}>
        {titleString}
      </div>
    );
  }
}

export { Title };

class Close extends React.Component {
  constructor(props) {
    super(props);
    let { options } = this.props.dialog;
    this.state = {
      fire: options.fire,
      close: options.close,
    };
  }

  componentDidMount() {
    let { options, EventEmitter } = this.props.dialog;
    EventEmitter.subscribe('fire', () => {
      this.setState({
        fire: options.fire,
      });
    });
  }

  close() {
    let dialog = this.props.dialog;
    let { fire, close } = dialog;
    typeof fire === 'function' && fire.call(dialog);
    typeof close === 'function' && close.call(dialog);
  }

  render() {
    return (
      this.state.fire ?
        (<a className="vd-close" onClick={() => this.close()} href="javascript:;">&times;</a>) :
        null
    );
  }
}

export { Close };

class Main extends React.Component {
  constructor(props) {
    super(props);
    let { options } = this.props.dialog;
    this.state = {
      name: options.type
    };
  }

  componentDidMount() {
    var that = this;
    this.props.dialog.EventEmitter.subscribe('type', function(name) {
      that.setState({
        name: name,
      });
    });
  }

  render() {
    let mainClassNames = ['vd-main'];
    let iconClassNames = [];
    if(this.state.name) {
      mainClassNames.push('vd-main-with-icon');
      iconClassNames.push('vd-icon icon-vd-'+ this.state.name);
    }
    return (
      <div className={mainClassNames.join(' ')}>
        <div className={iconClassNames.join(' ')}></div>
        {this.props.children}
      </div>
    );
  }
}

export { Main };

class Content extends React.Component {
  constructor(props) {
    super(props);
    let { options } = this.props.dialog;
    this.state = {
      content: options.content,
      width: 'auto',
      height: 'auto',
    };
  }

  componentDidMount() {
    var that = this;
    let { DOM, EventEmitter } = this.props.dialog;
    DOM.content = this.refs.content;
    EventEmitter.subscribe('content', function(content) {
      that.setState({
        content: content,
      });
    });
    EventEmitter.subscribe('width', function(width) {
      that.setState({
        width: width,
      });
    });
    EventEmitter.subscribe('height', function(height) {
      that.setState({
        width: height,
      });
    });
    EventEmitter.subscribe('padding', function(padding) {
      that.setState({
        padding: padding,
      });
    });
  }

  render() {
    let { dialog } = this.props;
    let styles = {
      width: isNaN(this.state.width) ? this.state.width : this.state.width + 'px',
      height: isNaN(this.state.height) ? this.state.height : this.state.height + 'px',
    };
    if(!isNaN(this.state.padding)) {
      styles.padding = isNaN(this.state.padding) ? this.state.padding : this.state.padding + 'px';
    }
    return (
      <div className="vd-content" ref="content" style={styles}>
        {dialog.options.content}
      </div>
    );
  }
}

export { Content };

class Footer extends React.Component {
  constructor(props) {
    super(props);
    let { options, _buttons } = this.props.dialog;
    this.state = {
      direction: options.direction,
      buttons: _buttons,
    };
  }

  componentDidMount() {
    let { _buttons, EventEmitter } = this.props.dialog;
    EventEmitter.subscribe('direction', name => {
      this.setState({
        direction: name,
      });
    });
    EventEmitter.subscribe('buttons', () => {
      this.setState({
        buttons: _buttons,
      });
    });
  }

  getButtons() {
    var dialog = this.props.dialog;
    var buttons = this.state.buttons.concat([]);
    dialog.options.direction === 'rtl' && buttons.reverse();
    return (
      <div>
        {
          buttons.map((button,index) => {
            var buttonComponent = (
              <a key={index}
                 data-name={button.name}
                 className={'vd-btn vd-btn-' + button.className}
                 href="javascript:;"
                 onClick={()=>typeof button.callback === 'function' && button.callback()}
                 ref={button.name}
              >{button.text}</a>
            );
            button.DOM = this.refs[button.name];
            return buttonComponent;
          })
        }
      </div>
    );
  }

  render() {
    let mainClassNames = ['vd-footer'];
    let styles = {};
    if(this.state.direction) {
      mainClassNames.push('vd-footer-'+ this.state.direction);
    }
    if(this.state.buttons.length > 0) {
      assign(styles, {
        display: 'block'
      });
    }
    return (
      <div className={mainClassNames.join(' ')} style={styles}>
        {this.getButtons()}
      </div>
    );
  }
}

export { Footer };