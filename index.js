import React from 'react';
import {Upload, Modal} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import PropTypes from 'prop-types';
import {isEqual, isEmpty} from 'lodash';

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

export default class PicturesWall extends React.Component {
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
     * 指定上传区域的大小
     */
    size: 104,

    /**
     * 提交时如果没有图片，是否转换值为 `undefined`（即不提交给后台）
     */
    emptyToUndefined: false,
  };

  static propTypes = {
    url: PropTypes.string,
    max: PropTypes.number,
    dataType: PropTypes.string,
    id: PropTypes.string,
    size: PropTypes.number,
    value: PropTypes.any,
    onChange: PropTypes.func,
    emptyToUndefined: PropTypes.bool,
  };

  state = {
    fileList: [],
    previewVisible: false,
    previewImage: '',
    previewTitle: '',
  };

  constructor(props) {
    super(props);

    if (props.value) {
      this.state.fileList = this.convertToFileList(props.value);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value) {
      const fileList = this.convertToFileList(this.props.value);
      if (!isEqual(this.convertToInputValue(this.state.fileList), this.convertToInputValue(fileList))) {
        // 如果值和 state 相同（例如通过 onChange 触发），不用更新
        this.setState({fileList});
      }
    }
  }

  /**
   * Convert input value to file list
   */
  convertToFileList = (value) => {
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

    throw new Error('Unsupported upload value: ' + JSON.stringify(value));
  };

  /**
   * Convert file list to input value
   */
  convertToInputValue = (fileList) => {
    let value;
    const dataType = this.props.dataType || (this.isMultiple() ? 'object' : 'string');
    switch (dataType) {
      case 'string':
        value = fileList?.[0]?.url || '';
        break;

      case 'array':
        value = fileList.map(file => file.url);
        break;

      case 'object':
        value = fileList.map(file => {
          // 其他的附加数据呢？
          return {id: file.id, url: file.url};
        });
    }

    if (this.props.emptyToUndefined && isEmpty(value)) {
      value = undefined;
    }
    return value;
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
    fileList.forEach(file => {
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
    const {size, url, max, value, onChange, ...rest} = this.props;

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
          fileList={this.state.fileList}
          onPreview={this.handlePreview}
          multiple={this.isMultiple()}
          locale={{
            previewFile: '预览文件',
            removeFile: '移除文件',
            downloadFile: '下载文件',
            uploading: '上传中...',
          }}
          onChange={(value) => {
            const fileList = this.processFileList(value.fileList);
            this.setState({fileList});
            onChange(this.convertToInputValue(fileList));
          }}
          {...rest}
        >
          {(max && this.state.fileList.length >= max) ? null : <div>
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
