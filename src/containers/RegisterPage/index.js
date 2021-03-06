import React, { Component } from 'react';
import './index.scss';
import Web3 from 'web3';
import Request from '../../utils/request';
import Modal from '../../components/Modal';
import notification from '../../components/Notification';
import SignInSignUp from '../../components/SignInSignUp';

export default class Register extends Component {
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

  register = async () => {
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
      const web3 = new Web3(new Web3.providers.HttpProvider('http://47.100.192.19:8545'));
      const shh = web3.shh;
      const id = await shh.newKeyPair();
      const pubKey = await shh.getPublicKey(id);
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      const response = await fetch('http://localhost:7001/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          username: name,
          password,
          pubKey,
          asymKeyId: id,
        }),
      });
      const data = await response.json();
      if (data.success) {
        // 弹窗
        this.setState({
          modal: {
            visible: true,
          },
        });
      } else {
        notification(data.message, 'error');
      }
    } catch (error) {
      notification(error, 'error');
    }
  };

  setValue = value => {
    const { name, password } = value;
    this.setState(
      {
        name,
        password,
      },
      async () => {
        await this.register();
      },
    );
  };

  confirm = () => {
    this.setState({
      // eslint-disable-next-line react/no-unused-state
      visible: false,
    });

    // eslint-disable-next-line react/prop-types
    this.props.history.push('/login');
  };

  render() {
    const { visible } = this.state.modal;
    return (
      <div className="register">
        <Modal title="提示" visible={visible} hasConfirm confirm={this.confirm} hasCancel={false}>
          <p className="content">您已注册成功</p>
        </Modal>
        {/* <Message isShow = {this.state.message.isShow}  type = {this.state.message.type}  content = {this.state.message.content} /> */}
        <SignInSignUp setValue={this.setValue} isRegister={false} />
      </div>
    );
  }
}
