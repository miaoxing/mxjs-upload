import React from 'react';
import {Upload, Modal} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import {FormContext} from '@mxjs/a-form';
import {setValue, getValue} from 'rc-field-form/lib/utils/valueUtil';

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

    /**
     * 如果 Form.Item 是多级或 id 和 name 不相同时，需要自行指定 name
     */
    name: null,

    /**
     * 指定上传区域的大小
     */
    size: 104,
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
    const name = this.props.name || [this.props.id];
    // 统一为 {fileList: []} 格式
    return setValue(values, name, {fileList: this.convertInputFile(getValue(values, name))});
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
    const name = this.props.name || [this.props.id];

    let value = getValue(values, name) || [];

    // TODO 可以去掉 ？
    if (typeof value.fileList !== 'undefined') {
      value = value.fileList;
    }

    const dataType = this.props.dataType || (!this.isMultiple() ? 'string' : 'object');
    switch (dataType) {
      case 'string':
        value = value.length ? value[0].url : '';
        break;

      case 'array':
        value = value.map(file => file.url);
        break;

      case 'object':
        value = value.map(file => {
          // 其他的附加数据呢？
          return {id: file.id, url: file.url};
        });
    }

    return setValue(values, name, value);
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

      if (file.response.code === 0) {
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
    const id = this.props.id;
    const {size, url, max, fileList, ...rest} = this.props;
    const files = this.processFileList(fileList);

    return (
      <div className={'ant-upload-container-' + id}>
        {/* 使用内联CSS，简化依赖 */}
        <style>
          {`
            .ant-upload-container-${id} {
              /* 上传单张图片时，不因隐藏上传图标而抖动页面 */
              min-height: ${size}px;
              min-width: ${size}px;
              line-height: 0; /* 移除空白 */
            }
            .ant-upload-container-${id} .ant-upload-list-picture-card-container,
            .ant-upload-container-${id} .ant-upload-list-picture-card .ant-upload-list-item,
            .ant-upload-container-${id} .ant-upload.ant-upload-select-picture-card {
              width: ${size}px;
              height: ${size}px;
              ${max === 1 ? 'margin: 0;' : ''}
            }
          `}
        </style>
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
