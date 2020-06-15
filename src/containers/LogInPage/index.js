import React, { Component } from 'react';
import Web3 from 'web3';
import Modal from '../../components/Modal';
import notification from '../../components/Notification';
import SignInSignUp from '../../components/SignInSignUp';
import InitApp from '../../modules/InitApp';
import './index.scss';

class LogIn extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      password: '',
      modal: {
        visible: false,
      },
    };
  }

  async login() {
    const { name, password } = this.state;
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(name)) {
      notification('用户名只能由汉字，数字，字母，下划线组成', 'warn');
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(password)) {
      notification('密码只能由字母数字组成', 'warn');
      return;
    }
    try {
      // const res = await Request.axios('post', '/api/v1/login', { name, password });
      // if (res && res.success) {
      //   localStorage.setItem('userInfo', JSON.stringify(res.userInfo));
      //   // 弹窗
      //   this.setState({
      //     modal: {
      //       visible: true,
      //     },
      //   });
      // } else {
      //   notification(res.message, 'error');
      // }
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      const body = JSON.stringify({
        username: name,
        password,
      });
      const response = await fetch('http://localhost:7001/login', {
        method: 'post',
        headers,
        body,
      });
      const data = await response.json();
      if (data.success) {
        const { pubKey, asymKeyId } = data.message;
        localStorage.setItem(
          'userInfo',
          JSON.stringify({
            pubKey,
            asymKeyId,
            user_id: pubKey,
            username: name,
          }),
        );
        await InitApp.init();
        this.setState({
          modal: {
            visible: true,
          },
        });
      }
    } catch (error) {
      notification(error, 'error');
    }
  }

  setValue = value => {
    const { name, password } = value;
    this.setState(
      {
        name,
        password,
      },
      async () => {
        await this.login();
      },
    );
  };

  confirm = () => {
    this.setState({
      modal: {
        visible: true,
      },
    });
    window.location.reload();
    const originalLink = sessionStorage.getItem('originalLink');
    if (originalLink) {
      sessionStorage.removeItem('originalLink');
      window.location.href = originalLink;
      return;
    }
    window.location.href = '/';
  };

  render() {
    const { visible } = this.state.modal;
    return (
      <div className="login">
        <Modal title="提示" visible={visible} confirm={this.confirm} hasConfirm>
          <p className="content"> 您已登录成功</p>
        </Modal>
        <SignInSignUp setValue={this.setValue} isRegister />
      </div>
    );
  }
}

export default LogIn;
