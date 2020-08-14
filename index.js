import React from 'react';
import {Upload, Modal} from 'antd';
import {PlusOutlined} from '@ant-design/icons';
import app from '@mxjs/app';

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
    url: app.url('admin-api/admins/upload'),

    /**
     * 最多添加几张图片,0表示不限制
     */
    max: 0,
  }

  state = {
    previewVisible: false,
    previewImage: '',
    previewTitle: '',
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

  prepareFileList(fileList) {
    // Case: 表单初始化，无值
    if (!fileList || fileList === '') {
      return [];
    }

    // Case: 在页面上传或删除文件
    if (typeof fileList.fileList !== 'undefined') {
      return fileList.fileList;
    }

    // Case: 后台返回的字符串地址
    if (typeof fileList === 'string') {
      return [
        {
          uid: fileList,
          url: fileList,
        },
      ];
    }

    return fileList;
  }

  processFileList(fileList) {
    fileList = this.prepareFileList(fileList);

    fileList.map(file => {
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
          multiple={max > 1}
          locale={{
            previewFile: '预览文件',
            removeFile: '移除文件',
            downloadFile: '下载文件',
            uploading: '上传中...',
          }}
          {...rest}
        >
          {files.length >= max ? null : <div>
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

export const convertToFirstFile = (values, name) => {
  // Case: 后台返回字符串直接提交
  let value = values[name];

  // Case：后台返回字符串，删除后上传新的图片
  if (typeof value.fileList !== 'undefined') {
    value = value.fileList;
  }

  // Case: 后台无返回，上传新的图片
  if (Array.isArray(value)) {
    value = value.length ? value[0].url : '';
  }

  values[name] = value;
  return values;
};
