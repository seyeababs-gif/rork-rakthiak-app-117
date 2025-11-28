import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { useMarketplace } from '@/contexts/MarketplaceContext';
import { useToast } from '@/contexts/ToastContext';
import { getButtonHeight, getInputHeight, getResponsiveValue } from '@/constants/responsive';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useMarketplace();
  const toast = useToast();
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('+221');
  const [showCountryPicker, setShowCountryPicker] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const countries = [
    { code: '+221', name: 'Sénégal', flag: '🇸🇳' },
    { code: '+223', name: 'Mali', flag: '🇲🇱' },
    { code: '+245', name: 'Guinée-Bissau', flag: '🇬🇼' },
    { code: '+220', name: 'Gambie', flag: '🇬🇲' },
    { code: '+222', name: 'Mauritanie', flag: '🇲🇷' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+32', name: 'Belgique', flag: '🇧🇪' },
    { code: '+39', name: 'Italie', flag: '🇮🇹' },
    { code: '+34', name: 'Espagne', flag: '🇪🇸' },
    { code: '+1', name: 'États-Unis', flag: '🇺🇸' },
  ];

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  const validatePhone = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 15;
  };

  const handleLogin = async () => {
    if (!phone.trim()) {
      toast.showError('Veuillez entrer votre numéro WhatsApp');
      return;
    }

    if (!validatePhone(phone)) {
      toast.showError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    if (!password.trim()) {
      toast.showError('Veuillez entrer votre mot de passe');
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `${countryCode}${phone}`;
      
      const result = await login(formattedPhone, password);

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        toast.showError(result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.showError('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/mc7ogltojagyi4vk0pc6f' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour accéder à votre compte
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Numéro WhatsApp</Text>
              <View style={styles.inputWrapper}>
                <TouchableOpacity
                  style={styles.phonePrefix}
                  onPress={() => setShowCountryPicker(!showCountryPicker)}
                  disabled={isLoading}
                >
                  <Text style={styles.phonePrefixText}>
                    {countries.find(c => c.code === countryCode)?.flag} {countryCode}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="77 123 45 67"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  maxLength={15}
                  editable={!isLoading}
                />
              </View>
              {showCountryPicker && (
                <View style={styles.countryPicker}>
                  {countries.map((country, index) => (
                    <TouchableOpacity
                      key={`country-${index}-${country.code}`}
                      style={[
                        styles.countryOption,
                        countryCode === country.code && styles.countryOptionSelected
                      ]}
                      onPress={() => {
                        setCountryCode(country.code);
                        setShowCountryPicker(false);
                      }}
                    >
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <Text style={styles.countryName}>{country.name}</Text>
                      <Text style={styles.countryCodeText}>{country.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Entrez votre mot de passe"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#666" />
                  ) : (
                    <Eye size={20} color="#666" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Text>
              <ArrowRight size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/auth/register')}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>
                Pas encore de compte ? <Text style={styles.linkTextBold}>Inscrivez-vous</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              En vous connectant, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveValue({ mobile: 24, tablet: 32, desktop: 48 }),
    paddingBottom: 40,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#0D2D5E',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0D2D5E',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  phonePrefix: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#BFDBFE',
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0D2D5E',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0D2D5E',
    paddingHorizontal: 16,
    height: getInputHeight(),
  },
  phoneInput: {
    paddingLeft: 12,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D2D5E',
    height: getButtonHeight(),
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#0D2D5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkTextBold: {
    fontWeight: '700' as const,
    color: '#2563EB',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  countryPicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    marginTop: 8,
    overflow: 'hidden',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF6FF',
  },
  countryOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  countryFlag: {
    fontSize: 24,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0D2D5E',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
});
