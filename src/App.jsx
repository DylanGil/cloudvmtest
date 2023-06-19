import React, { useState } from "react";
import { Button, Form, Input, message } from "antd";
import "./App.css"; // Import a separate CSS file for custom styles
import Users from "./public/users.json";

const App = () => {
  const [isAuth, setIsAuth] = useState(false);

  const onFinish = (values) => {
    console.log("Success:", values);
    console.log("Users:", Users);
    const user = Users.find(
      (user) =>
        user.username === values.username && user.password === values.password
    );
    console.log("user :>> ", user);
    if (!user) {
      message.error("Invalid username or password");
    } else setIsAuth(true);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  if (isAuth) {
    return <div>Auth</div>;
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
