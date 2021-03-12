import React, {Component} from 'react';
import { StyleSheet, Button, View, SafeAreaView, TextInput,PermissionsAndroid,Text, Alert } from 'react-native';
import SendSMS from 'react-native-sms';
import Geolocation from '@react-native-community/geolocation';
import {Switch} from 'react-native-paper';
import dgram from 'react-native-udp';


const Separator = () => (
  <View style={styles.separator} />
);

export default class App_Front extends React.Component {

  constructor(){
    super();
    this.state = {
        gps_sw:false,

        Latitude_text:'XXXXXX',
        Longitude_text:'XXXXXX',
        Altitude_text:'XXXXXX',
        TimeStamp_text:'XXXXXX',
        Recipients: 'XXXXXX',

        Server_ip: '192.168.137.1',
        Server_port: '4000',
        Host_port: '4000'
    }
    global.client=null;
    global.socket_init_sw=true;
    global.udp_client=false;
    global.permission=true;
    global.Longitude= "";
    global.Latitude= "";
    global.Altitude= "";
    global.TimeStamp= "";
    
  }
  
  async componentDidMount(){

    if (global.permission==true) {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
  
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("You can use the phone GPS");
          global.permission=false;
        } else {
          console.log("You can´t use the phone GPS");
          global.permission=true;
        }
      } catch (err) {
        console.warn(err);
      }
    }      
  }
  
  GPS_SW=()=>{
    if (this.state.gps_sw==false) {
      this.GPS_START();
    }else{
      this.GPS_STOP();
    }
  }

  GPS_START=()=>{

    Geolocation.getCurrentPosition( position =>{
      console.log("INIT GPS");
    });

    Geolocation.watchPosition(position => {

      global.Longitude=position.coords.longitude.toString();
      global.Latitude=position.coords.latitude.toString();
      global.Altitude=position.coords.altitude.toString();
      global.TimeStamp=position.timestamp.toString();

      this.setState({
        Latitude_text: global.Latitude,
        Longitude_text: global.Longitude,
        Altitude_text: global.Altitude,
        TimeStamp_text: global.TimeStamp,
      });

      if (global.udp_client){
        this.UDP_CLIENT_SEND();}
      
    },error => {console.log("GPS ERROR: ",error)}, {maximumAge:0,enableHighAccuracy:true,distanceFilter:0}); 
  }
  
  GPS_STOP=()=>{

    Geolocation.stopObserving();

    this.setState({
      Latitude_text: "XXXXXX",
      Longitude_text: "XXXXXX",
      Altitude_text: "XXXXXX",
      TimeStamp_text: "XXXXXX",
    }); 
  }
    
  SEND_SMS=()=>{
    SendSMS.send({
      body: "Longitude: " + global.Longitude + "\n" + 
            "Latitude: " + global.Latitude + "\n" +
            "Altitude: " + global.Altitude + "\n" +
            "TimeStamp: " + global.TimeStamp + "\n", 
      recipients: [this.state.Recipients],
      successTypes: ['sent', 'queued'],
      allowAndroidSendWithoutReadPermission: false
      }, (completed, cancelled, error) => {
      console.log('SMS Callback: completed: ' + completed + ' cancelled: ' + cancelled + 'error: ' + error);});
  }

  convertStringToByteArray(str){
    String.prototype.encodeHex = function () {
    var bytes = [];
    for (var i = 0; i < this.length; ++i) {
     bytes.push(this.charCodeAt(i));
    }
    return bytes;
    };
    var byteArray = str.encodeHex();
    return byteArray
  }

  UDP_CLIENT_START=()=>{
    //NO CAMBIA EL PUERTO!!!
    global.udp_client=true;
    if (global.socket_init_sw){
      global.client=dgram.createSocket('udp4');
      try{
        console.log(this.state.Host_port);
        global.client.bind(parseInt(this.state.Host_port,10));
        global.socket_init_sw=false;
      }catch(err){
        Alert.alert("binding failed");
    }
    }
  }

  UDP_CLIENT_STOP=()=>{
    global.client.close();
    global.udp_client=false;
    global.socket_init_sw=true;
    
  }

  UDP_CLIENT_SEND=()=>{
    data=this.convertStringToByteArray(
      "\n"+ 
      "Longitude: " + global.Longitude + "\n" + 
      "Latitude: " + global.Latitude + "\n" +
      "Altitude: " + global.Altitude + "\n" +
      "TimeStamp: " + global.TimeStamp + "\n");
    try{
    global.client.send(data,0,data.length,parseInt(this.state.Server_port,10),this.state.Server_ip);
    }catch(err){
      global.udp_client=false;
      Alert.alert("Connection Failed");
    }
  }

  render(){return(
  <SafeAreaView style={styles.container}>
    <Separator />
    <View style={styles.container2}>
    <View style={[styles.box, styles.box1]}>
    <Text style={styles.baseText}>
      {"Latitude: "}
    <Text style={styles.innerText}>{this.state.Latitude_text}</Text>
    </Text>
    <Text style={styles.baseText}>
      {"Longitud: "}
    <Text style={styles.innerText}>{this.state.Longitude_text}</Text>
    </Text>
    <Text style={styles.baseText}>
      {"Altitud: "}
    <Text style={styles.innerText}>{this.state.Altitude_text}</Text>
    </Text>
    <Text style={styles.baseText}>
      {"Timestamp: "}
    <Text style={styles.innerText}>{this.state.TimeStamp_text}</Text>
    </Text>
    </View>
    <View style={[styles.box, styles.box4]}>
    <Text style={styles.baseText}>
      {"\n"+"Enable GPS:"}
    </Text>
    <Switch value={this.state.gps_sw} onValueChange={onchange =>{
      this.setState({
        gps_sw:!this.state.gps_sw
      });
      this.GPS_SW();
    }
    }/>
    </View>
    </View>
    

    <Separator />

    <View style={[styles.box, styles.box2]}>
    <Text style={styles.innerText}>{'Recipient: '}</Text>
    <TextInput
      style={{height:40,borderColor:"gray",borderWidth: 1}}
      value={this.state.Recipients}
      onChangeText={text=>{
        this.setState({
          Recipients: text
      });
      }}/>
    <Separator/>
    <Text style={styles.innerText}>{'Host Port: '}</Text>
    <TextInput
      style={{height:40,borderColor:"gray",borderWidth: 1}}
      value={this.state.Host_port}
      onChangeText={text=>{
        this.setState({
          Host_port: text
      });
      }}/>
    <Separator/>
    
    <Text style={styles.innerText}>{'Server Ip: '}</Text>
    <TextInput
      style={{height:40,borderColor:"gray",borderWidth: 1}}
      value={this.state.Server_ip}
      onChangeText={text=>{
        this.setState({
          Server_ip: text
      });
      }}/>

    <Separator/>

    <Text style={styles.innerText}>{'Server Port: '}</Text>
    <TextInput
      style={{height:40,borderColor:"gray",borderWidth: 1}}
      value={this.state.Server_port}
      onChangeText={text=>{
        this.setState({
          Server_port: text
      });
      }}/>
    </View>
    <Separator/>

    <View style={[styles.box, styles.box3]}>

    <View>
      <Button
        title="UDP START"
        color="#252766"
        onPress={this.UDP_CLIENT_START}
      />
    </View>
    
    <Separator />

    <View>
      <Button
        title="UDP STOP"
        color="#252766"
        onPress={this.UDP_CLIENT_STOP}
      />
    </View>

    <Separator />

    <View>
      <Button
        title="SEND SMS"
        color="#252766"
        onPress={this.SEND_SMS}
      />
    </View>
    
    </View>
    <Separator />
  </SafeAreaView>
  );
}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  container2: {
    flex: 1.5,
    flexDirection: 'row',
  },
  box: {
    flex: 1 //set this one
  },
  box1: {
    flex: 2,
    backgroundColor: '#f0f3f5'
  },
  box2: {
    flex: 6,
    backgroundColor: '#f0f3f5'
  },
  box3: {
    flex: 3,
    backgroundColor: '#f0f3f5'
  },
  box4: {
    flex: 1.2,
    backgroundColor: '#f0f3f5'
  },
  title: {
    textAlign: 'center',
    marginVertical: 8,
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  baseText: {
    fontWeight: 'bold',
    color: 'red'
  },
  innerText: {
    color: 'black',
    fontWeight: 'bold',
  },
});
