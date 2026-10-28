import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BrandFooter from "../components/BrandFooter";

const API_URL =
  "https://wooshradio.com/wp-json/contact-form-7/v1/contact-forms/13570/feedback";

const MAX_FIELD_LENGTH = 400;
const MAX_MESSAGE_LENGTH = 2000;

type FormField = "your-name" | "your-email" | "your-subject" | "your-message";

type InvalidField = {
  field?: string;
  message?: string;
  error_id?: string;
};

export default function ContactScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "">(
    "",
  );
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  function clearFieldError(field: FormField) {
    setInvalidFields((current) => current.filter((item) => item !== field));
    setFeedback("");
    setFeedbackType("");
  }

  function validateForm(): boolean {
    const errors: string[] = [];

    if (!name.trim()) errors.push("your-name");
    if (!email.trim()) errors.push("your-email");
    if (!subject.trim()) errors.push("your-subject");
    if (!message.trim()) errors.push("your-message");

    if (name.length > MAX_FIELD_LENGTH) errors.push("your-name");
    if (email.length > MAX_FIELD_LENGTH) errors.push("your-email");
    if (subject.length > MAX_FIELD_LENGTH) errors.push("your-subject");
    if (message.length > MAX_MESSAGE_LENGTH) errors.push("your-message");

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push("your-email");
    }

    setInvalidFields([...new Set(errors)]);

    if (errors.length > 0) {
      setFeedback("Please check the highlighted fields and try again.");
      setFeedbackType("error");
      return false;
    }

    return true;
  }

  async function submitForm() {
    if (loading || !validateForm()) return;

    setLoading(true);
    setFeedback("");
    setFeedbackType("");

    try {
      const formData = new FormData();

      formData.append("_wpcf7_unit_tag", "wpcf7-f13570-o1");
      formData.append("your-name", name.trim());
      formData.append("your-email", email.trim());
      formData.append("your-subject", subject.trim());
      formData.append("your-message", message.trim());

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      const result = await response.json();

      if (result.status === "mail_sent") {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setInvalidFields([]);
        setFeedback(
          result.message ||
            "Thank you for contacting WOOSH RADIO. Your message has been sent successfully.",
        );
        setFeedbackType("success");
      } else if (result.status === "validation_failed") {
        const fields: InvalidField[] = Array.isArray(result.invalid_fields)
          ? result.invalid_fields
          : [];

        setInvalidFields(
          fields.map((field) => field.field || "").filter(Boolean),
        );
        setFeedback(
          result.message ||
            "Please check your details and correct the highlighted fields.",
        );
        setFeedbackType("error");
      } else if (result.status === "spam") {
        setFeedback(
          result.message ||
            "Your message could not be accepted. Please try again later.",
        );
        setFeedbackType("error");
      } else {
        setFeedback(
          result.message ||
            "We couldn't send your message. Please try again later.",
        );
        setFeedbackType("error");
      }
    } catch {
      setFeedback(
        "We couldn't connect to WOOSH RADIO. Check your internet connection and try again.",
      );
      setFeedbackType("error");
    } finally {
      setLoading(false);
    }
  }

  function renderField({
    label,
    value,
    onChangeText,
    field,
    placeholder,
    maxLength,
    multiline = false,
    keyboardType = "default",
    autoComplete,
  }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    field: FormField;
    placeholder: string;
    maxLength: number;
    multiline?: boolean;
    keyboardType?: "default" | "email-address";
    autoComplete?: "name" | "email";
  }) {
    const hasError = invalidFields.includes(field);

    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{label} *</Text>

        <TextInput
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            clearFieldError(field);
          }}
          placeholder={placeholder}
          placeholderTextColor="#8983A7"
          maxLength={maxLength}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={
            keyboardType === "email-address" ? "none" : "sentences"
          }
          autoComplete={autoComplete}
          textContentType={
            autoComplete === "name"
              ? "name"
              : autoComplete === "email"
                ? "emailAddress"
                : "none"
          }
          editable={!loading}
          style={[
            styles.input,
            multiline && styles.messageInput,
            hasError && styles.inputError,
          ]}
          textAlignVertical={multiline ? "top" : "center"}
          accessibilityLabel={label}
          accessibilityState={{ disabled: loading }}
        />

        <View style={styles.fieldFooter}>
          {hasError ? (
            <Text style={styles.fieldError}>Please check this field.</Text>
          ) : (
            <View />
          )}

          <Text style={styles.characterCount}>
            {value.length}/{maxLength}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={styles.brand}>WOOSH RADIO</Text>
          <Text style={styles.heading}>Get in touch.</Text>
          <Text style={styles.description}>
            Have a shout-out, music request, artist feature, or business
            enquiry? Send us a message.
          </Text>

          <View style={styles.formCard}>
            {renderField({
              label: "Your name",
              value: name,
              onChangeText: setName,
              field: "your-name",
              placeholder: "Enter your full name",
              maxLength: MAX_FIELD_LENGTH,
              autoComplete: "name",
            })}

            {renderField({
              label: "Email address",
              value: email,
              onChangeText: setEmail,
              field: "your-email",
              placeholder: "you@example.com",
              maxLength: MAX_FIELD_LENGTH,
              keyboardType: "email-address",
              autoComplete: "email",
            })}

            {renderField({
              label: "Subject",
              value: subject,
              onChangeText: setSubject,
              field: "your-subject",
              placeholder: "What is your enquiry about?",
              maxLength: MAX_FIELD_LENGTH,
            })}

            {renderField({
              label: "Your message",
              value: message,
              onChangeText: setMessage,
              field: "your-message",
              placeholder: "Write your message here...",
              maxLength: MAX_MESSAGE_LENGTH,
              multiline: true,
            })}

            {feedback !== "" && (
              <View
                style={[
                  styles.feedbackBox,
                  feedbackType === "success"
                    ? styles.successBox
                    : styles.errorBox,
                ]}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Text
                  style={[
                    styles.feedbackText,
                    feedbackType === "success"
                      ? styles.successText
                      : styles.errorText,
                  ]}
                >
                  {feedback}
                </Text>
              </View>
            )}

            <Pressable
              onPress={submitForm}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !loading && styles.submitButtonPressed,
                loading && styles.submitButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{
                disabled: loading,
                busy: loading,
              }}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.submitButtonText}>Sending...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>SEND MESSAGE</Text>
              )}
            </Pressable>

            <Text style={styles.privacyNote}>
              Your message will be processed through WOOSH RADIO's website
              contact system.
            </Text>
          </View>

          <BrandFooter />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0B1A",
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    marginBottom: 28,
  },
  backText: {
    color: "#D8B4FE",
    fontSize: 15,
    fontWeight: "600",
  },
  brand: {
    color: "#D8B4FE",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 12,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
  },
  description: {
    color: "#D0CDDF",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 26,
  },
  formCard: {
    backgroundColor: "#17152B",
    borderColor: "#302849",
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 9,
  },
  input: {
    minHeight: 50,
    backgroundColor: "#0B0B1A",
    borderWidth: 1,
    borderColor: "#39314F",
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 15,
  },
  messageInput: {
    minHeight: 145,
    paddingTop: 14,
  },
  inputError: {
    borderColor: "#F08B9B",
  },
  fieldFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  fieldError: {
    color: "#F5A5B0",
    fontSize: 12,
  },
  characterCount: {
    color: "#8983A7",
    fontSize: 11,
    marginLeft: "auto",
  },
  feedbackBox: {
    borderWidth: 1,
    borderRadius: 11,
    padding: 13,
    marginBottom: 16,
  },
  successBox: {
    backgroundColor: "#142B27",
    borderColor: "#286B58",
  },
  errorBox: {
    backgroundColor: "#301B28",
    borderColor: "#784052",
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 20,
  },
  successText: {
    color: "#A7E5CE",
  },
  errorText: {
    color: "#FFC0CA",
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 2,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  privacyNote: {
    color: "#8983A7",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 16,
  },
});
