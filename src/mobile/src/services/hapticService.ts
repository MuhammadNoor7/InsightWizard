import * as Haptics from 'expo-haptics';

/**
 * Premium Haptic Feedback utility for tactical sensory polish.
 */
export const triggerHaptic = {
  /**
   * Light Tap: triggered on subtle interactions like domain chip selection
   */
  lightTap: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Quietly ignore in simulator/web environments
    }
  },

  /**
   * Reassuring Pulse: triggered on pipeline completions and screen transitions
   */
  reassuringPulse: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Quietly ignore in simulator/web environments
    }
  },

  /**
   * Warning Alert / Double Buzz: triggered on high-security confirm & authorize commands
   */
  warningAlert: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      // Quietly ignore in simulator/web environments
    }
  },

  /**
   * Error Alert: triggered on pipeline failures or critical authorization issues
   */
  errorAlert: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Quietly ignore in simulator/web environments
    }
  },

  /**
   * Selection feedback for standard toggles and micro-clicks
   */
  selection: async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      // Quietly ignore in simulator/web environments
    }
  }
};
