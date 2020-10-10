import React from 'react';
import {Upload, Modal} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import {FormContext} from '@mxjs/a-form';

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

export default class PicturesWall extends React.Component {
  static contextType = FormContext;

  static defaultProps = {
    /**
     * 提交到后台的地址
     */
    url: null,

    /**
     * 最多添加几张图片,0表示不限制
     */
    max: 0,

    /**
     * 提交到后台的数据格式
     */
    dataType: null,
  }

  state = {
    previewVisible: false,
    previewImage: '',
    previewTitle: '',
  };

  constructor(props, context) {
    super(props, context);

    context.setInputConverter(this.inputConverter);
    context.setOutputConverter(this.outputConverter);
  }

  inputConverter = (values) => {
    // 统一为 {fileList: []} 格式
    values[this.props.id] = {fileList: this.convertInputFile(values[this.props.id])};
    return values;
  };

  convertInputFile = (value) => {
    // Case: 无值，例如刚初始化
    if (!value) {
      return [];
    }

    // Case: 字符串，例如单个图片
    if (typeof value === 'string') {
      return [{url: value}];
    }

    // Case: 图片数组，例如多个图片 ['url.jpg', 'url2.jpg']
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value.map(file => ({url: file}));
    }

    // Case 图片数组对象 [{url: '1.jpg'},{url: '2.jpg'}]
    if (Array.isArray(value)) {
      return value;
    }

    throw new Error('Unsupported upload value: ' + JSON.stringify(value))
  }

  outputConverter = (values) => {
    const name = this.props.id;

    let value = values[name] || [];

    // TODO 可以去掉 ？
    if (typeof value.fileList !== 'undefined') {
      value = value.fileList;
    }

    const dataType = this.props.dataType || (!this.isMultiple() ? 'string' : 'object');
    switch (dataType) {
      case 'string':
        values[name] = value.length ? value[0].url : '';
        break;

      case 'array':
        values[name] = value.map(file => file.url);
        break;

      case 'object':
        values[name] = value.map(file => {
          // 其他的附加数据呢？
          return {url: file.url};
        });
    }

    return values;
  };

  handleCancel = () => this.setState({previewVisible: false});

  handlePreview = async file => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    this.setState({
      previewImage: file.url || file.preview,
      previewVisible: true,
      previewTitle: file.name || file.url.substring(file.url.lastIndexOf('/') + 1),
    });
  };

  processFileList(fileList) {
    fileList = fileList ? fileList.fileList : [];

    fileList.map(file => {
      if (!file.uid) {
        file.uid = file.url;
      }

      // 后台返回了，则更新后台的信息
      if (!file.response) {
        return;
      }

      if (file.response.code === 1) {
        file.status = 'done';
        file.url = file.response.url;
      } else {
        file.status = 'error';
        file.error = {
          statusText: file.response.message,
        };
      }
    });

    return fileList;
  }

  isMultiple() {
    return this.props.max !== 1;
  }

  render() {
    const {url, max, fileList, ...rest} = this.props;
    const files = this.processFileList(fileList);

    return (
      // 上传单张图片时，不因隐藏上传图标而抖动页面
      <div style={{minHeight: 118}}>
        <Upload
          action={url}
          listType="picture-card"
          fileList={files}
          onPreview={this.handlePreview}
          multiple={this.isMultiple()}
          locale={{
            previewFile: '预览文件',
            removeFile: '移除文件',
            downloadFile: '下载文件',
            uploading: '上传中...',
          }}
          {...rest}
        >
          {(max && files.length >= max) ? null : <div>
            <PlusOutlined/>
          </div>}
        </Upload>
        <Modal
          visible={this.state.previewVisible}
          title={this.state.previewTitle}
          footer={null}
          onCancel={this.handleCancel}
        >
          <img style={{width: '100%'}} src={this.state.previewImage}/>
        </Modal>
      </div>
    );
  }
}
