import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue
} from 'react-native-health';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.StepCount,
    ],
    write: [
      AppleHealthKit.Constants.Permissions.Steps,
    ],
},
} as HealthKitPermissions;

export function initAppleHealth(onSuccess: () => void, onError: (error: string) => void) {
  console.log("Initializing Apple Health...");
  AppleHealthKit.initHealthKit(permissions, (error: string) => {
    if (error) {
      console.log('[ERROR] Cannot grant permissions!', error);
      onError(error);
      return;
    }
    // Permissions granted, safe to proceed
    console.log('Apple Health permissions granted.');
    onSuccess();
  });
}

export function getHeartRateSamples(startDate: Date, callback: (results: HealthValue[]) => void) {
  console.log("Fetching heart rate samples...");
  const options = {
    startDate: startDate.toISOString(), // required
  };

  AppleHealthKit.getHeartRateSamples(options, (err: string, results: HealthValue[]) => {
    if (err) {
      console.log('Error fetching heart rate:', err);
      callback([]);
      return;
    }
    callback(results);
  });
}

export function getStepsSamples(startDate: Date, callback: (results: HealthValue[]) => void) {
  console.log("Fetching steps samples...");
  const options = {
    startDate: startDate.toISOString(), // required
  };
  AppleHealthKit.getStepCount(options, (err: string, result: HealthValue) => {
    if (err) {
      console.log('Error fetching steps:', err);
      callback([]);
      return;
    }
    callback([result]);
  });
}
