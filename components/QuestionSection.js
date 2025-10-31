import { React, useState, useContext } from 'react';
import { View, ScrollView, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { styles } from '../styles/gameStyles';
import { Random } from '../utilities/Random';
import { RandomAnswerOptions } from '../utilities/RandomAnswerOptions';

export default function QuestionSection() {
    return (
        <View style={styles.cardBody}>
            <View style={styles.mb4}>
                <Text style={styles.lightText}>
                    What is the capital city of {gameData.Country}, located in {gameData.Continent}?
                </Text>
            </View>
            <View>
                {/* shows list of all options, not sorted */}
                {/* <FlatList
                                data={allData.map(item => ({ label: item.CapitalName, value: item.CapitalName }))}
                                keyExtractor={(item) => item.value}
                                renderItem={({ item }) => (
                                    <Button
                                        title={item.label}
                                        onPress={() => handleAnswerChange({ value: item.value })}
                                        disabled={isAnsweredCorrectly}
                                    />
                                )}/> */}

                {/* shows 5 randomized options, including correct answer */}
                {answerOptions.map((option, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={[
                            styles.answerButton,
                            answer === option && styles.selectedAnswerButton,
                            isAnsweredCorrectly && option === gameData.Capital && styles.correctAnswerButton
                        ]}
                        onPress={() => {
                            if (isAnsweredCorrectly !== true) {
                                const isCorrect = option === gameData.Capital;
                                const answerObj = {
                                    CountryName: gameData.Country,
                                    CapitalName: option,
                                    isCorrect,
                                };
                                // Only add if not already in the list
                                const isDuplicate = answers.some(
                                    a =>
                                        a.CountryName === answerObj.CountryName &&
                                        a.CapitalName === answerObj.CapitalName
                                );
                                if (!isDuplicate) {
                                    setAnswers([...answers, answerObj]);
                                    addItem(answerObj, db);
                                }
                                setAnswer(option);
                                setIsAnsweredCorrectly(isCorrect);

                                Toast.show({
                                    type: isCorrect ? 'success' : 'error',
                                    text1: isCorrect ? 'Congrats! You got it right!' : 'Oops! That was not correct.',
                                    position: 'top',
                                });
                            }
                        }}
                        disabled={isAnsweredCorrectly === true}
                    >
                        <Text style={styles.answerButtonText}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
                style={styles.newGameButton}
                onPress={onClickHandlerNewGame}>
                <Text style={styles.newGameButtonText}>New Game</Text>
            </TouchableOpacity>
        </View>
    );
}

