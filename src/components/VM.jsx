import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  Select,
  message,
  Typography,
  Space,
  Spin,
  List,
} from "antd";
import "../App.css";
import Users from "../public/users.json";
import axios from "axios";

const { Title, Text } = Typography;

const VM = () => {
  const [vm, setVm] = useState({
    publisher: "Canonical",
    offer: "UbuntuServer",
    sku: "18.04-LTS",
  });
  const [vmOptions, setVmOptions] = useState([]);
  const [vmLoading, setVmLoading] = useState(false);
  const [vmCreated, setVmCreated] = useState(false);
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userLogged = JSON.parse(sessionStorage.getItem("user"));
    const vmCreated = JSON.parse(sessionStorage.getItem("vm"));
    if (vmCreated) {
      if (new Date() > new Date(vmCreated.deleteDate)) {
        sessionStorage.removeItem("vm");
        setVmCreated(false);
        window.location.reload();
      }
      setVmCreated(vmCreated);
    }
    setUser(userLogged);
    switch (userLogged.username) {
      case "userNoCredit":
      default:
        setVmOptions();
        break;
      case "userOneVM":
        setVmOptions([{ value: "ubuntu", label: "Ubuntu 18.04" }]);
        break;
      case "userManyVM":
        setVmOptions([
          { value: "ubuntu", label: "Ubuntu 18.04" },
          { value: "centos", label: "CentOS 7.5" },
        ]);
        break;
    }
    setIsLoading(false);
  }, []);

  const handleChange = (value) => {
    switch (value) {
      case "ubuntu":
      default:
        setVm({
          publisher: "Canonical",
          offer: "UbuntuServer",
          sku: "18.04-LTS",
        });
        break;
      case "centos":
        setVm({
          publisher: "OpenLogic",
          offer: "CentOS",
          sku: "7.5",
        });
        break;
    }
  };

  const onFinish = () => {
    setVmLoading(true);
    try {
      axios
        .post(`http://localhost:${process.env["BACKEND_PORT"]}/create-vm`, vm)
        .then((res) => {
          message.success("VM created!");
          setVmLoading(false);
          setVmCreated(res.data);
          sessionStorage.setItem("vm", JSON.stringify(res.data));
        });
    } catch (error) {
      console.log("error :>> ", error);
      message.error("Error creating VM, please try again");
    }
  };

  if (isLoading) {
    return <Spin size="large" />;
  }

  if (user.username === "userNoCredit") {
    return (
      <div>
        <Title>You don't have enough credit to create a VM</Title>

        <Button
          type="primary"
          danger
          href="/"
          onClick={() => sessionStorage.clear()}
        >
          Logout
        </Button>
      </div>
    );
  }

  if (vmCreated) {
    return (
      <Space direction="vertical">
        <Title>VM created!</Title>
        <Title level={5} style={{ margin: 0 }}>
          IP: {vmCreated.ip}
        </Title>
        <Title level={5} style={{ margin: 0 }}>
          Username: {vmCreated.username}
        </Title>
        <Title level={5} style={{ margin: 0 }}>
          Password: {vmCreated.password}
        </Title>
        <List
          size="small"
          bordered
          renderItem={(item) => <List.Item>{item}</List.Item>}
        >
          <List.Item>
            <Text>
              1. Open your terminal <br />
            </Text>
          </List.Item>
          <List.Item>
            <Text>
              2. Write{" "}
              <Text code>
                ssh {vmCreated.username}@{vmCreated.ip} <br />
              </Text>
            </Text>
          </List.Item>
          <List.Item>
            <Text>
              3. Write the password: <Text code>{vmCreated.password}</Text>
              <br />
            </Text>
          </List.Item>
          <List.Item>
            <Text>
              4. Enjoy! (the session will end at{" "}
              {new Date(vmCreated.deleteDate).toLocaleTimeString()})
            </Text>
          </List.Item>
        </List>
        <Button
          type="primary"
          danger
          href="/"
          onClick={() => {
            sessionStorage.removeItem("user");
          }}
        >
          Logout
        </Button>
        {user.username === "userManyVM" && (
          <Button
            type="primary"
            onClick={() => {
              sessionStorage.removeItem("vm");
              setVmCreated(false);
              window.location.reload();
            }}
          >
            Create another VM
          </Button>
        )}
      </Space>
    );
  }

  return (
    <Space direction="vertical">
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        autoComplete="off"
        onFinish={onFinish}
      >
        <Space direction="vertical">
          {!vmLoading ? (
            <div>
              <Title>Choose your VM</Title>
              <Space direction="horizontal">
                <Select
                  defaultValue="ubuntu"
                  style={{ width: 200 }}
                  onChange={handleChange}
                  options={vmOptions}
                />
                <Button type="primary" htmlType="submit">
                  Create VM
                </Button>
                <br></br>
              </Space>

              <br />
              <br />
              <Button
                type="primary"
                danger
                href="/"
                onClick={() => sessionStorage.clear()}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <Title>Creating your VM</Title>
              <Space direction="horizontal">
                <Text>It may take up to 10 minutes</Text>
                <Spin spinning={vmLoading}></Spin>
              </Space>
            </div>
          )}
        </Space>
      </Form>
    </Space>
  );
};

export default VM;
