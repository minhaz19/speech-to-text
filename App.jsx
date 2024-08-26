/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Voice from '@react-native-voice/voice';

function App() {
  const [started, setStarted] = useState('');
  const [ended, setEnded] = useState('');
  const [result, setResult] = useState([]);
  const [local, setLocal] = useState('en-US');

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;

    Voice.getSpeechRecognitionServices().then(services => {
      console.log({services}, 'ddddd');
    });

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = e => {
    console.log('Voice Start', e);
    setStarted('✅');
  };
  const onSpeechEnd = e => {
    console.log('Voice Stop', e);
    setEnded('✅');
  };
  const onSpeechResults = e => {
    console.log('Voice Results', e);
    setResult(e.value);
  };

  const startRecognizing = async () => {
    try {
      await Voice.start(local);
      setStarted('');
      setEnded('');
      setResult([]);
    } catch (error) {
      console.log(error);
    }
  };
  const stopRecognizing = async () => {
    try {
      await Voice.stop();
      await Voice.destroy();
      setStarted('');
      setEnded('');
      setResult([]);
    } catch (error) {
      console.log(error);
    }
  };

  const toggleLanguage = () => {
    if (local === 'en-US') {
      setLocal('bn-BD');
    } else {
      setLocal('en-US');
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <Text
        style={{
          alignSelf: 'center',
          color: 'black',
          fontSize: 20,
          marginVertical: 20,
        }}>
        Voice To Text Recognition
      </Text>
      <TouchableOpacity
        onPress={toggleLanguage}
        style={{
          width: '80%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'green',
          padding: 10,
          borderRadius: 10,
          alignSelf: 'center',
        }}>
        <Text style={{fontSize: 20, color: 'white', paddingVertical: 5}}>
          Change Language: {local === 'en-US' ? 'English' : 'Bangla'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={startRecognizing}
        style={{alignSelf: 'center', marginTop: 20}}>
        <Image
          source={require('./src/assets/voice.png')}
          style={{width: 100, height: 100, alignSelf: 'center'}}
        />
      </TouchableOpacity>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          marginTop: 20,
        }}>
        <Text style={{fontSize: 20, fontWeight: 700, color: 'black'}}>
          Start {started}
        </Text>
        <Text style={{fontSize: 20, fontWeight: 700, color: 'black'}}>
          End {ended}
        </Text>
      </View>
      <ScrollView style={{alignSelf: 'center', marginTop: 20}}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'black',
            margin: 10,
            paddingHorizontal: 20,
            textAlign: 'center',
          }}>
          {result[0]}
        </Text>
      </ScrollView>
      <TouchableOpacity
        onPress={stopRecognizing}
        style={{
          width: '100%',
          position: 'absolute',
          height: 60,
          backgroundColor: 'red',
          justifyContent: 'center',
          alignItems: 'center',
          bottom: 0,
        }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 700,
            textAlign: 'center',
            color: 'white',
          }}>
          Stop Listening
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({});

export default App;
