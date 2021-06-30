import React from 'react';
import Upload from '..';
import {render, waitFor, fireEvent} from '@testing-library/react';
import {Form, FormItem} from '@mxjs/a-form';
import {MemoryRouter} from 'react-router';
import {createPromise} from '@mxjs/test';
import $ from 'miaoxing';

describe('upload', () => {
  test('one: value', async () => {
    const {container} = render(<MemoryRouter>
      <Form initialValues={{
        image: '1.jpg',
      }}>
        <FormItem name="image">
          <Upload max={1}/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    await waitFor(() => expect(container.querySelector('.ant-upload-list-item-image')).not.toBeNull());
  });

  test('one: submit', async () => {
    const promise = createPromise();
    $.http = jest.fn().mockImplementation(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {},
      },
    }));

    const {container} = render(<MemoryRouter>
      <Form initialValues={{}}>
        <FormItem name="image">
          <Upload max={1}/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    container.querySelector('form').submit();
    await promise;

    expect($.http).toMatchSnapshot();
  });

  test('one: load and submit', async () => {
    const promise = createPromise();
    const promise2 = createPromise();
    $.http = jest.fn().mockImplementationOnce(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {
          image: '1.jpg',
        },
      },
    })).mockImplementation(() => promise2.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {},
      },
    }));

    const {container} = render(<MemoryRouter>
      <Form>
        <FormItem name="image">
          <Upload max={1}/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    await promise;
    await waitFor(() => expect(container.querySelector('.ant-upload-list-item-image')).not.toBeNull());

    container.querySelector('form').submit();
    await promise2;

    expect($.http).toMatchSnapshot();
  });

  test('one: load, delete and submit', async () => {
    const promise = createPromise();
    const promise2 = createPromise();
    $.http = jest.fn().mockImplementationOnce(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {
          image: '1.jpg',
        },
      },
    })).mockImplementation(() => promise2.resolve({
      ret: {
        code: 0,
        message: 'success',
        data: {},
      },
    }));

    const {container, getByTitle} = render(<MemoryRouter>
      <Form>
        <FormItem name="image">
          <Upload max={1}/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    await promise;
    await waitFor(() => expect(container.querySelector('.ant-upload-list-item-image')).not.toBeNull());

    fireEvent.click(getByTitle('移除文件'));
    await waitFor(() => expect(container.querySelector('.ant-upload-list-item-image')).toBeNull());

    container.querySelector('form').submit();
    await promise2;

    expect($.http).toMatchSnapshot();
  });

  test('multiple: submit', async () => {
    const promise = createPromise();
    $.http = jest.fn().mockImplementation(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {},
      },
    }));

    const {container} = render(<MemoryRouter>
      <Form initialValues={{}}>
        <FormItem name="image">
          <Upload max={9}/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    container.querySelector('form').submit();
    await promise;

    expect($.http).toMatchSnapshot();
  });

  test('multiple: load and submit', async () => {
    const promise = createPromise();
    const promise2 = createPromise();
    $.http = jest.fn().mockImplementationOnce(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {
          image: [
            {
              url: '1.jpg',
            },
            {
              url: '2.jpg',
            },
          ],
        },
      },
    })).mockImplementation(() => promise2.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {},
      },
    }));

    const {container} = render(<MemoryRouter>
      <Form>
        <FormItem name="image">
          <Upload max={9}/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    await promise;
    await waitFor(() => expect(container.querySelector('.ant-upload-list-item-image')).not.toBeNull());

    container.querySelector('form').submit();
    await promise2;

    $.http.mock.calls[1][0].data.image.forEach(image => {
      image.uid = 'fixed';
    });

    expect($.http).toMatchSnapshot();
  });

  test('multiple: load, remove and submit', async () => {
    const promise = createPromise();
    const promise2 = createPromise();
    $.http = jest.fn().mockImplementationOnce(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {
          image: [
            {
              url: '1.jpg',
            },
            {
              url: '2.jpg',
            },
          ],
        },
      },
    })).mockImplementation(() => promise2.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {},
      },
    }));

    const {container, getAllByTitle} = render(<MemoryRouter>
      <Form>
        <FormItem name="image">
          <Upload max={9}/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    await promise;
    await waitFor(() => expect(container.querySelectorAll('.ant-upload-list-item-image').length).toBe(2));

    fireEvent.click(getAllByTitle('移除文件')[0]);
    await waitFor(() => expect(container.querySelectorAll('.ant-upload-list-item-image').length).toBe(1));

    container.querySelector('form').submit();
    await promise2;

    expect($.http).toMatchSnapshot();
  });

  test('max', async () => {
    const promise = createPromise();
    $.http = jest.fn().mockImplementationOnce(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {
          image: '1.jpg',
        },
      },
    }));

    const {container, getByTitle} = render(<MemoryRouter>
      <Form>
        <FormItem name="image">
          <Upload max={1}/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    await promise;
    await waitFor(() => expect(container.querySelector('.ant-upload-list-item-image')).not.toBeNull());
    expect(container.querySelector('.anticon-plus')).toBeNull();

    fireEvent.click(getByTitle('移除文件'));
    await waitFor(() => expect(container.querySelector('.ant-upload-list-item-image')).toBeNull());
    expect(container.querySelector('.anticon-plus')).not.toBeNull();

    expect($.http).toMatchSnapshot();
  });

  test('dataType：array', async () => {
    const promise = createPromise();
    const promise2 = createPromise();
    $.http = jest.fn().mockImplementationOnce(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {
          image: [
            '1.jpg',
            '2.jpg',
          ],
        },
      },
    })).mockImplementation(() => promise2.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {},
      },
    }));

    const {container} = render(<MemoryRouter>
      <Form>
        <FormItem name="image">
          <Upload max={9} dataType="array"/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    await promise;
    await waitFor(() => expect(container.querySelector('.ant-upload-list-item-image')).not.toBeNull());

    container.querySelector('form').submit();
    await promise2;

    expect($.http).toMatchSnapshot();
  });

  test('dataType：object', async () => {
    const promise = createPromise();
    const promise2 = createPromise();
    $.http = jest.fn().mockImplementationOnce(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {
          image: [
            {
              uid: '1.jpg',
              url: '1.jpg',
            },
            {
              uid: '2.jpg',
              url: '2.jpg',
            },
          ],
        },
      },
    })).mockImplementation(() => promise2.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {},
      },
    }));

    const {container} = render(<MemoryRouter>
      <Form>
        <FormItem name="image">
          <Upload max={9} dataType="object"/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    await promise;
    await waitFor(() => expect(container.querySelector('.ant-upload-list-item-image')).not.toBeNull());

    container.querySelector('form').submit();
    await promise2;

    expect($.http).toMatchSnapshot();
  });

  test('emptyToUndefined', async () => {
    const promise = createPromise();
    $.http = jest.fn().mockImplementation(() => promise.resolve({
      ret: {
        code: 1,
        message: 'success',
        data: {},
      },
    }));

    const {container} = render(<MemoryRouter>
      <Form initialValues={{}}>
        <FormItem name="image">
          <Upload max={1} emptyToUndefined/>
        </FormItem>
      </Form>
    </MemoryRouter>);

    container.querySelector('form').submit();
    await promise;

    expect($.http).toMatchSnapshot();
  });
});
