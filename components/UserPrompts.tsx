import React, { useState, useEffect } from 'react';

// ask questions to user
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';

interface UserPromptsProps {
  onSubmit: (name: string, age: any, currentMood: string | null, desiredMood: string | null) => void;
}

export const UserPrompts: React.FC<UserPromptsProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('');
  const moodTags = ['happy', 'sad', 'energetic', 'tired', 'stressed', 'relaxed', 'anxious', 'motivated', 'bored', 'excited'];
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [desiredMood, setDesiredMood] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Update form validity when any field changes
  useEffect(() => {
    const valid = !!(name && age && currentMood && desiredMood);
    setIsFormValid(valid);
    //console.log('Form state changed:', {name, age, currentMood, desiredMood, disabled: !valid, isFormValid: valid});
  }, [name, age, currentMood, desiredMood]);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />
      <Text style={styles.label}>Age:</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        placeholder="Enter your age"
        keyboardType="numeric"
      />
      <Text style={styles.label}>Mood Now:</Text>
      <View style={styles.tagContainer}>
        {moodTags.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tag,
              currentMood === tag && styles.selectedTag
            ]}
            onPress={() => {
              //console.log('Current mood selected:', tag);
              setCurrentMood(tag);
            }}
          >
          <Text>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>How do you want to feel:</Text>
      <View style={styles.tagContainer}>
        {moodTags.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tag,
              desiredMood === tag && styles.selectedTag
            ]}
            onPress={() => {
              //console.log('Desired mood selected:', tag);
              setDesiredMood(tag);
            }}
          >
          <Text>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: isFormValid ? "#007AFF" : "#666" }
        ]}
        onPress={() => isFormValid && onSubmit(name, age, currentMood, desiredMood)}
        disabled={!isFormValid}
      >
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
      {/* Debug info */}
      {/* <Text style={{color: 'red', fontSize: 14, marginTop: 10, backgroundColor: 'yellow', padding: 5}}>
        DEBUG: name={name ? '✓' : '✗'}, age={age ? '✓' : '✗'}, currentMood={currentMood ? '✓' : '✗'}, desiredMood={desiredMood ? '✓' : '✗'}
      </Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTag: {
    backgroundColor: '#e0f2ff',
    borderColor: '#36a2ef',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});