import React, { useState } from "react";
import { Button, Form, Input, message } from "antd";
import "./App.css";
import Users from "./public/users.json";
import VM from "./components/VM";

const App = () => {
  const [isAuth, setIsAuth] = useState(false);

  const onFinish = (values) => {
    const user = Users.find(
      (user) =>
        user.username === values.username && user.password === values.password
    );
    if (!user) {
      message.error("Invalid username or password");
    } else setIsAuth(true);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  if (isAuth) {
    return <VM />;
  }

  return (
    <Form
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item
        label="Username"
        name="username"
        initialValue={"userManyVM"}
        rules={[
          {
            required: true,
            message: "Please input your username!",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        initialValue={"password"}
        rules={[
          {
            required: true,
            message: "Please input your password!",
          },
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};

export default App;
