import InitApp from '../../modules/InitApp';

function initAppOnce(props) {
  if (Object.prototype.toString.call(props) !== '[object Object]') {
    throw new Error('please input props for init function');
  }
  if (!props.initializedApp && props.initApp) {
    InitApp.init().then(() => {
      props.initApp(true);
    });
  }
}

export { initAppOnce };
