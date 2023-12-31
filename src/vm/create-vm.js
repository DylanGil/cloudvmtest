const util = require("util");
const { DefaultAzureCredential } = require("@azure/identity");
const { ComputeManagementClient } = require("@azure/arm-compute");
const { ResourceManagementClient } = require("@azure/arm-resources");
const { StorageManagementClient } = require("@azure/arm-storage");
const { NetworkManagementClient } = require("@azure/arm-network");

const createVmFunction = async (reqBody) => {
  // Store function output to be used elsewhere
  let randomIds = {};
  let subnetInfo = null;
  let publicIPInfo = null;
  let vmImageInfo = null;
  let nicInfo = null;

  //Random number generator for service names and settings
  let resourceGroupName = _generateRandomId("diberry-testrg", randomIds);
  let vmName = _generateRandomId("testvm", randomIds);
  let storageAccountName = _generateRandomId("testac", randomIds);
  let vnetName = _generateRandomId("testvnet", randomIds);
  let subnetName = _generateRandomId("testsubnet", randomIds);
  let publicIPName = _generateRandomId("testpip", randomIds);
  let networkInterfaceName = _generateRandomId("testnic", randomIds);
  let ipConfigName = _generateRandomId("testcrpip", randomIds);
  let domainNameLabel = _generateRandomId("testdomainname", randomIds);
  let osDiskName = _generateRandomId("testosdisk", randomIds);

  // Resource configs
  const location = "francecentral"; //eastus
  const accType = "Standard_LRS";

  // Ubuntu config for VM
  const publisher = reqBody.publisher || "Canonical";
  const offer = reqBody.offer || "UbuntuServer";
  const sku = reqBody.sku || "18.04-LTS";
  const adminUsername = "DylanAdmin";
  const adminPassword = makePassword(15);

  // Azure platform authentication
  const clientId = process.env["AZURE_CLIENT_ID"];
  const domain = process.env["AZURE_TENANT_ID"];
  const secret = process.env["AZURE_CLIENT_SECRET"];
  const subscriptionId = process.env["AZURE_SUBSCRIPTION_ID"];

  if (!clientId || !domain || !secret || !subscriptionId) {
    console.log("Default credentials couldn't be found");
  }
  const credentials = new DefaultAzureCredential();

  // Azure services
  const resourceClient = new ResourceManagementClient(
    credentials,
    subscriptionId
  );
  const computeClient = new ComputeManagementClient(
    credentials,
    subscriptionId
  );
  const storageClient = new StorageManagementClient(
    credentials,
    subscriptionId
  );
  const networkClient = new NetworkManagementClient(
    credentials,
    subscriptionId
  );

  let authResult = null;

  // Create resources then manage them (on/off)
  const createVm = async () => {
    try {
      await createResources();
      await manageResources();
      const deleteDate = new Date(Date.now() + 600000);
      console.log("VM will be deleted: " + deleteDate);
      setTimeout(() => {
        deleteResourceGroup();
      }, 600000); // 600000 Delete resource group after 10 minutes
      return {
        ip: authResult.ip,
        username: authResult.username,
        password: authResult.password,
        deleteDate: deleteDate,
      };
      // return `ip: ${authResult.ip}, username: ${authResult.username}, password: ${authResult.password}`;
    } catch (err) {
      console.log(err);
    }
  };

  function makePassword(length) {
    const complexityRequirements = [
      /[A-Z]/, // Uppercase character
      /[a-z]/, // Lowercase character
      /\d/, // Numeric digit
      /[!@#$%^&*]/, // Special character
    ];

    const allowedChars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";

    while (
      password.length < 15 ||
      complexityRequirements.filter((req) => req.test(password)).length < 3
    ) {
      password = "";
      for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * allowedChars.length);
        password += allowedChars[randomIndex];
      }
    }

    return password + "!";
  }

  const createResources = async () => {
    try {
      result = await createResourceGroup();
      accountInfo = await createStorageAccount();
      vnetInfo = await createVnet();
      subnetInfo = await getSubnetInfo();
      publicIPInfo = await createPublicIP();
      nicInfo = await createNIC(subnetInfo, publicIPInfo);
      vmImageInfo = await findVMImage();
      nicResult = await getNICInfo();
      vmInfo = await createVirtualMachine(nicInfo.id, vmImageInfo[0].name);
      return;
    } catch (err) {
      console.log(err);
    }
  };

  const createResourceGroup = async () => {
    const groupParameters = {
      location: location,
      tags: { sampletag: "sampleValue" },
    };
    console.log("\n1.Creating resource group: " + resourceGroupName);
    return await resourceClient.resourceGroups.createOrUpdate(
      resourceGroupName,
      groupParameters
    );
  };

  const createStorageAccount = async () => {
    console.log("\n2.Creating storage account: " + storageAccountName);
    const createParameters = {
      location: location,
      sku: {
        name: accType,
      },
      kind: "Storage",
      tags: {
        tag1: "val1",
        tag2: "val2",
      },
    };
    return await storageClient.storageAccounts.beginCreateAndWait(
      resourceGroupName,
      storageAccountName,
      createParameters
    );
  };
  const createVnet = async () => {
    const vnetParameters = {
      location: location,
      addressSpace: {
        addressPrefixes: ["10.0.0.0/16"],
      },
      dhcpOptions: {
        dnsServers: ["10.1.1.1", "10.1.2.4"],
      },
      subnets: [{ name: subnetName, addressPrefix: "10.0.0.0/24" }],
    };
    console.log("\n3.Creating vnet: " + vnetName);
    return await networkClient.virtualNetworks.beginCreateOrUpdateAndWait(
      resourceGroupName,
      vnetName,
      vnetParameters
    );
  };

  const getSubnetInfo = async () => {
    console.log("\nGetting subnet info for: " + subnetName);
    return await networkClient.subnets.get(
      resourceGroupName,
      vnetName,
      subnetName
    );
  };
  const createPublicIP = async () => {
    const publicIPParameters = {
      location: location,
      publicIPAllocationMethod: "Dynamic",
      dnsSettings: {
        domainNameLabel: domainNameLabel,
      },
    };
    console.log("\n4.Creating public IP: " + publicIPName);
    return await networkClient.publicIPAddresses.beginCreateOrUpdateAndWait(
      resourceGroupName,
      publicIPName,
      publicIPParameters
    );
  };

  const createNIC = async (subnetInfo, publicIPInfo) => {
    const nicParameters = {
      location: location,
      ipConfigurations: [
        {
          name: ipConfigName,
          privateIPAllocationMethod: "Dynamic",
          subnet: subnetInfo,
          publicIPAddress: publicIPInfo,
        },
      ],
    };
    console.log("\n5.Creating Network Interface: " + networkInterfaceName);
    return await networkClient.networkInterfaces.beginCreateOrUpdateAndWait(
      resourceGroupName,
      networkInterfaceName,
      nicParameters
    );
  };
  const findVMImage = async () => {
    console.log(
      util.format(
        "\nFinding a VM Image for location %s from " +
          "publisher %s with offer %s and sku %s",
        location,
        publisher,
        offer,
        sku
      )
    );
    return await computeClient.virtualMachineImages.list(
      location,
      publisher,
      offer,
      sku,
      { top: 1 }
    );
  };
  const getNICInfo = async () => {
    return await networkClient.networkInterfaces.get(
      resourceGroupName,
      networkInterfaceName
    );
  };

  const createVirtualMachine = async (nicId, vmImageVersionNumber) => {
    const vmParameters = {
      location: location,
      osProfile: {
        computerName: vmName,
        adminUsername: adminUsername,
        adminPassword: adminPassword,
      },
      hardwareProfile: {
        vmSize: "Standard_B1ls",
      },
      storageProfile: {
        imageReference: {
          publisher: publisher,
          offer: offer,
          sku: sku,
          version: vmImageVersionNumber,
        },
        osDisk: {
          name: osDiskName,
          caching: "None",
          createOption: "fromImage",
          vhd: {
            uri:
              "https://" +
              storageAccountName +
              ".blob.core.windows.net/nodejscontainer/osnodejslinux.vhd",
          },
        },
      },
      networkProfile: {
        networkInterfaces: [
          {
            id: nicId,
            primary: true,
          },
        ],
      },
    };
    console.log("6.Creating Virtual Machine: " + vmName);
    console.log(
      " VM create parameters: " + util.inspect(vmParameters, { depth: null })
    );
    await computeClient.virtualMachines.beginCreateOrUpdateAndWait(
      resourceGroupName,
      vmName,
      vmParameters
    );
  };

  const getVmIP = async () => {
    try {
      const vm = await computeClient.virtualMachines.get(
        resourceGroupName,
        vmName
      );
      const networkInterfaces = vm.networkProfile.networkInterfaces;

      if (networkInterfaces.length > 0) {
        const primaryNIC = networkInterfaces.find((nic) => nic.primary);
        if (primaryNIC) {
          const nic = await networkClient.networkInterfaces.get(
            resourceGroupName,
            getNicName(primaryNIC.id)
          );
          if (nic && nic.ipConfigurations.length > 0) {
            const ipConfig = nic.ipConfigurations[0];
            if (ipConfig.publicIPAddress && ipConfig.publicIPAddress.id) {
              const publicIP = await networkClient.publicIPAddresses.get(
                resourceGroupName,
                getPublicIpName(ipConfig.publicIPAddress.id)
              );
              if (publicIP && publicIP.ipAddress) {
                console.log("VM Public IP Address:", publicIP.ipAddress);
                return publicIP.ipAddress;
              } else {
                console.log("No IP address found for the VM's public IP.");
                return "noIpFound";
              }
            } else {
              console.log(
                "No public IP address associated with the VM's primary network interface."
              );
            }
          } else {
            console.log(
              "No IP configurations found for the VM's primary network interface."
            );
          }
        } else {
          console.log("No primary network interface found for the VM.");
        }
      } else {
        console.log("No network interfaces found for the VM.");
      }
    } catch (error) {
      console.log(
        "An error occurred while retrieving the VM IP address:",
        error
      );
    }
  };

  const getNicName = (nicId) => {
    // Extract the NIC name from its resource ID
    const parts = nicId.split("/");
    return parts[parts.length - 1];
  };

  const getPublicIpName = (publicIpId) => {
    // Extract the public IP name from its resource ID
    const parts = publicIpId.split("/");
    return parts[parts.length - 1];
  };

  const getVMInfo = async () => {
    let vmPublicIPAddress = await getVmIP();
    while (vmPublicIPAddress === "noIpFound") {
      await sleep(10000); // sleep 10 seconds
      vmPublicIPAddress = await getVmIP();
    }
    authResult = {
      ip: vmPublicIPAddress ? vmPublicIPAddress : "noIpFound",
      username: adminUsername,
      password: adminPassword,
    };
  };

  const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const manageResources = async () => {
    await getVirtualMachines();
    await turnOffVirtualMachines(resourceGroupName, vmName, computeClient);
    await startVirtualMachines(resourceGroupName, vmName);
    const resultListVirtualMachines = await listVirtualMachines();
    console.log(
      util.format(
        "List all the vms under the current " + "subscription \n%s",
        util.inspect(resultListVirtualMachines, { depth: null })
      )
    );
    await getVMInfo();
  };
  const getVirtualMachines = async () => {
    console.log(`Get VM Info about ${vmName}`);
    return await computeClient.virtualMachines.get(resourceGroupName, vmName);
  };
  const turnOffVirtualMachines = async () => {
    console.log(`Poweroff the VM ${vmName}`);
    return await computeClient.virtualMachines.beginDeallocate(
      resourceGroupName,
      vmName
    );
  };
  const startVirtualMachines = async () => {
    console.log(`Start the VM ${vmName}`);
    return await computeClient.virtualMachines.beginStart(
      resourceGroupName,
      vmName
    );
  };
  const listVirtualMachines = async () => {
    console.log(`Lists VMs`);
    const result = new Array();
    for await (const item of computeClient.virtualMachines.listAll()) {
      result.push(item);
    }
    return result;
  };

  function _generateRandomId(prefix, existIds) {
    var newNumber;
    while (true) {
      newNumber = prefix + Math.floor(Math.random() * 10000);
      if (!existIds || !(newNumber in existIds)) {
        break;
      }
    }
    return newNumber;
  }
  const deleteResourceGroup = async () => {
    console.log("\nDeleting resource group: " + resourceGroupName);
    return await resourceClient.resourceGroups.beginDeleteAndWait(
      resourceGroupName
    );
  };

  return new Promise(async (resolve, reject) => {
    const result = await createVm();
    resolve(result);
  });
};

module.exports = {
  createVmFunction,
};
