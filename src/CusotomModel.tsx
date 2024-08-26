import React, { useState, useEffect, useRef } from 'react';
import {
    NativeScrollEvent,
    SafeAreaView,
    ScrollView,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Cheetah, CheetahErrors } from '@picovoice/cheetah-react-native';
import {
    VoiceProcessor,
    VoiceProcessorError,
} from '@picovoice/react-native-voice-processor';

enum UIState {
    loading,
    init,
    recording,
    stopping,
    error,
}

const CustomModel = () => {
    const [appState, setAppState] = useState<UIState>(UIState.loading);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<string>('');
    const [isBottom, setIsBottom] = useState<boolean>(false);

    const cheetahRef = useRef<Cheetah>();
    const voiceProcessorRef = useRef<VoiceProcessor>();
    const scrollViewRef = useRef<ScrollView | null>(null);

    const accessKey = '${YOUR_ACCESS_KEY_HERE}'; // AccessKey obtained from Picovoice Console (https://console.picovoice.ai/)
    const modelPath = require('./assets/cheetah_params.pv');
    useEffect(() => {
        const init = async () => {
            try {
                cheetahRef.current = await Cheetah.create(
                    accessKey,
                    modelPath,
                    { enableAutomaticPunctuation: true },
                );
            } catch (err: any) {
                handleError(err);
                return;
            }

            voiceProcessorRef.current = VoiceProcessor.instance;
            voiceProcessorRef.current.addFrameListener(async (buffer: number[]) => {
                if (!cheetahRef.current || !(await voiceProcessorRef.current?.isRecording())) {
                    return;
                }

                try {
                    const partialResult = await cheetahRef.current.process(buffer);
                    if (partialResult.isEndpoint) {
                        const remainingResult = await cheetahRef.current.flush();
                        let transcriptText =
                            transcription +
                            partialResult.transcript +
                            remainingResult.transcript;
                        if (remainingResult.transcript.length > 0) {
                            transcriptText += ' ';
                        }
                        setTranscription(transcriptText);
                    } else {
                        setTranscription(transcription + partialResult.transcript);
                    }
                } catch (e: any) {
                    handleError(e);
                }
            });

            voiceProcessorRef.current.addErrorListener((error: VoiceProcessorError) => {
                handleError(error);
            });
            setAppState(UIState.init);
        };

        init();

        return () => {
            const cleanup = async () => {
                if (appState === UIState.recording) {
                    await stopProcessing();
                }
                if (cheetahRef.current !== undefined) {
                    await cheetahRef.current.delete();
                    cheetahRef.current = undefined;
                }
            };
            cleanup();
        };
    }, [appState, transcription]);

    const handleError = (err: any) => {
        let errorMessage: string;
        if (err instanceof CheetahErrors.CheetahInvalidArgumentError) {
            errorMessage = `${err.message}`;
        } else if (err instanceof CheetahErrors.CheetahActivationError) {
            errorMessage = 'AccessKey activation error';
        } else if (err instanceof CheetahErrors.CheetahActivationLimitError) {
            errorMessage = 'AccessKey reached its device limit';
        } else if (err instanceof CheetahErrors.CheetahActivationRefusedError) {
            errorMessage = 'AccessKey refused';
        } else if (err instanceof CheetahErrors.CheetahActivationThrottledError) {
            errorMessage = 'AccessKey has been throttled';
        } else {
            errorMessage = err.toString();
        }

        setAppState(UIState.error);
        setErrorMessage(errorMessage);
    };

    const startProcessing = async () => {
        setAppState(UIState.recording);
        setTranscription('');
        setIsBottom(true);

        try {
            await voiceProcessorRef.current?.start(
                cheetahRef.current!.frameLength,
                cheetahRef.current!.sampleRate,
            );
        } catch (err: any) {
            handleError(err);
        }
    };

    const stopProcessing = async () => {
        setAppState(UIState.stopping);

        try {
            await voiceProcessorRef.current?.stop();
        } catch (err: any) {
            handleError(err);
            return;
        }

        try {
            const result = await cheetahRef.current?.flush();
            if (result !== undefined) {
                setTranscription(transcription + result.transcript);
                setAppState(UIState.init);
            }
        } catch (err: any) {
            handleError(err);
        }
    };

    const toggleListening = async () => {
        if (appState === UIState.recording) {
            await stopProcessing();
        } else if (appState === UIState.init) {
            await startProcessing();
        }
    };

    const checkBottom = ({
        layoutMeasurement,
        contentOffset,
        contentSize,
    }: NativeScrollEvent) => {
        setIsBottom(
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 1,
        );
    };
    console.log(appState);
    const disabled = false;

    console.log({ disabled });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#377DFF" />
            <View style={styles.statusBar}>
                <Text style={styles.statusBarText}>Cheetah</Text>
            </View>
            <View style={{ flex: 6 }}>
                <View style={styles.transcriptionBox}>
                    <ScrollView
                        ref={scrollViewRef}
                        onScroll={({ nativeEvent }) => checkBottom(nativeEvent)}
                        onContentSizeChange={() => {
                            if (isBottom) {
                                scrollViewRef.current?.scrollToEnd({ animated: true });
                            }
                        }}>
                        <Text style={styles.transcriptionText}>
                            {transcription}
                        </Text>
                    </ScrollView>
                </View>
            </View>

            {appState === UIState.error && (
                <View style={styles.errorBox}>
                    <Text
                        style={{
                            color: 'white',
                            fontSize: 16,
                        }}>
                        {errorMessage}
                    </Text>
                </View>
            )}

            <View
                style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>
                <TouchableOpacity
                    style={[styles.buttonStyle, disabled ? styles.buttonDisabled : {}]}
                    onPress={toggleListening}
                    disabled={disabled}>
                    <Text style={styles.buttonText}>
                        {appState === UIState.recording ? 'Stop' : 'Start'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 0.5, justifyContent: 'center', paddingBottom: 10 }}>
                <Text style={styles.instructions}>
                    Made in Vancouver, Canada by Picovoice
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#F5FCFF',
    },
    subContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    statusBar: {
        flex: 1,
        backgroundColor: '#377DFF',
        justifyContent: 'flex-end',
        maxHeight: 50,
    },
    statusBarText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 15,
        marginBottom: 15,
    },
    buttonStyle: {
        width: '50%',
        height: 60,
        alignSelf: 'center',
        justifyContent: 'center',
        backgroundColor: '#377DFF',
        borderRadius: 100,
    },
    buttonText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    buttonDisabled: {
        backgroundColor: 'gray',
    },
    itemStyle: {
        fontWeight: 'bold',
        fontSize: 20,
        textAlign: 'center',
    },
    instructions: {
        textAlign: 'center',
        color: '#666666',
    },
    errorBox: {
        backgroundColor: 'red',
        margin: 20,
        padding: 20,
        textAlign: 'center',
    },
    transcriptionBox: {
        backgroundColor: '#25187E',
        margin: 20,
        padding: 20,
        height: '100%',
        flex: 1,
    },
    transcriptionText: {
        fontSize: 20,
        color: 'white',
    },
});

export default CustomModel;
