/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, Button, Alert} from 'react-native';

import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer'

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};
export default class App extends Component<Props> {

  constructor() {
    super();
    this.manager = new BleManager();
    this.state = {
      isScanning: false,
      isConnected: false,
      showAllDeviceButtons: true,
      readValue: '',
      allScannedDevices: []
    }
  }

  scanAndConnect = () => {
    this.setState({
      isScanning: true,
    });
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        return;
      }

      if (device.name && !this.state.allScannedDevices.some(function(el){ return el.id === device.id})) {
        console.log("Device Found: " + device.name + " ("+device.id+")");
        this.setState(prevState => ({
          allScannedDevices: [...prevState.allScannedDevices, device]
        }))
      }
    });
  }

  stopScanning = () => {
    this.setState({
      isScanning: false,
    });
    this.manager.stopDeviceScan();
    console.log("All Devices: ", this.state.allScannedDevices);
  }

  connectToDevice = (device) => {
    this.setState({
      showAllDeviceButtons: false,
    });
    console.log("CONNECTING TO: ", device);
    device.connect()
    .then((device) => {
      this.setState({
        isConnected: true,
      });
      return device.discoverAllServicesAndCharacteristics()
    })
    .then((device) => {
      this.manager.characteristicsForDevice(device.id, '0000ec00-0000-1000-8000-00805f9b34fb').then((char) => {
        console.log("CHARACTERISTIC: ", char);
      });
    })
    .catch((error) => {
      console.error(error)
    });
  }

  writeToDevice = () => {
    /*this.manager.writeCharacteristicWithResponseForDevice('B8:27:EB:37:7E:98', '0000ec00-0000-1000-8000-00805f9b34fb', '0000ec0e-0000-1000-8000-00805f9b34fb', 'VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==').then((res) => {
      console.log('Response: ', res);
    });*/
    this.manager.monitorCharacteristicForDevice('B8:27:EB:37:7E:98', '0000ec00-0000-1000-8000-00805f9b34fb', '0000ec0e-0000-1000-8000-00805f9b34fb', (err, res) => {
      let buf = Buffer.from(atob(res.value));
      let tempStr = buf.join('');
      console.log(tempStr);
      this.setState({
        readValue: tempStr,
      });
    });
  }

  render() {

    renderAllDevices = () => this.state.allScannedDevices.map(function(device) {
      return <View key={device.id} style={styles.eachDeviceButton}>
              <Button
                title={device.name}
                onPress={() => this.connectToDevice(device)}
              />
            </View>;
    }, this);

    return (
      <View style={styles.container}>
        {!this.state.isScanning && <Button title="Scan and Connect" onPress={() => this.scanAndConnect()} />}
        {this.state.isScanning && <Button title="Stop Scanning" onPress={() => this.stopScanning()} />}
        <View>
          {this.state.showAllDeviceButtons && renderAllDevices()}
          {this.state.isConnected && <Button title="Write to Device" onPress={() => this.writeToDevice()} />}
          <Text>{this.state.readValue}</Text>
        </View>
        
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  eachDeviceButton: {
    margin: 5,
  }
});
