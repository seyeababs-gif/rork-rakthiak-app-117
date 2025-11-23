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
    { code: '+93', name: 'Afghanistan', flag: '🇦🇫' },
    { code: '+355', name: 'Albanie', flag: '🇦🇱' },
    { code: '+213', name: 'Algérie', flag: '🇩🇿' },
    { code: '+376', name: 'Andorre', flag: '🇦🇩' },
    { code: '+244', name: 'Angola', flag: '🇦🇴' },
    { code: '+54', name: 'Argentine', flag: '🇦🇷' },
    { code: '+61', name: 'Australie', flag: '🇦🇺' },
    { code: '+43', name: 'Autriche', flag: '🇦🇹' },
    { code: '+973', name: 'Bahreïn', flag: '🇧🇭' },
    { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
    { code: '+32', name: 'Belgique', flag: '🇧🇪' },
    { code: '+229', name: 'Bénin', flag: '🇧🇯' },
    { code: '+975', name: 'Bhoutan', flag: '🇧🇹' },
    { code: '+591', name: 'Bolivie', flag: '🇧🇴' },
    { code: '+387', name: 'Bosnie-Herzégovine', flag: '🇧🇦' },
    { code: '+267', name: 'Botswana', flag: '🇧🇼' },
    { code: '+55', name: 'Brésil', flag: '🇧🇷' },
    { code: '+673', name: 'Brunéi', flag: '🇧🇳' },
    { code: '+359', name: 'Bulgarie', flag: '🇧🇬' },
    { code: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
    { code: '+257', name: 'Burundi', flag: '🇧🇮' },
    { code: '+855', name: 'Cambodge', flag: '🇰🇭' },
    { code: '+237', name: 'Cameroun', flag: '🇨🇲' },
    { code: '+1', name: 'Canada', flag: '🇨🇦' },
    { code: '+238', name: 'Cap-Vert', flag: '🇨🇻' },
    { code: '+236', name: 'Centrafrique', flag: '🇨🇫' },
    { code: '+56', name: 'Chili', flag: '🇨🇱' },
    { code: '+86', name: 'Chine', flag: '🇨🇳' },
    { code: '+57', name: 'Colombie', flag: '🇨🇴' },
    { code: '+269', name: 'Comores', flag: '🇰🇲' },
    { code: '+242', name: 'Congo', flag: '🇨🇬' },
    { code: '+243', name: 'RD Congo', flag: '🇨🇩' },
    { code: '+82', name: 'Corée du Sud', flag: '🇰🇷' },
    { code: '+850', name: 'Corée du Nord', flag: '🇰🇵' },
    { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
    { code: '+225', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: '+385', name: 'Croatie', flag: '🇭🇷' },
    { code: '+53', name: 'Cuba', flag: '🇨🇺' },
    { code: '+357', name: 'Chypre', flag: '🇨🇾' },
    { code: '+420', name: 'Tchéquie', flag: '🇨🇿' },
    { code: '+45', name: 'Danemark', flag: '🇩🇰' },
    { code: '+253', name: 'Djibouti', flag: '🇩🇯' },
    { code: '+20', name: 'Égypte', flag: '🇪🇬' },
    { code: '+971', name: 'Émirats arabes unis', flag: '🇦🇪' },
    { code: '+593', name: 'Équateur', flag: '🇪🇨' },
    { code: '+291', name: 'Érythrée', flag: '🇪🇷' },
    { code: '+372', name: 'Estonie', flag: '🇪🇪' },
    { code: '+251', name: 'Éthiopie', flag: '🇪🇹' },
    { code: '+358', name: 'Finlande', flag: '🇫🇮' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+241', name: 'Gabon', flag: '🇬🇦' },
    { code: '+220', name: 'Gambie', flag: '🇬🇲' },
    { code: '+995', name: 'Géorgie', flag: '🇬🇪' },
    { code: '+49', name: 'Allemagne', flag: '🇩🇪' },
    { code: '+233', name: 'Ghana', flag: '🇬🇭' },
    { code: '+30', name: 'Grèce', flag: '🇬🇷' },
    { code: '+224', name: 'Guinée', flag: '🇬🇳' },
    { code: '+245', name: 'Guinée-Bissau', flag: '🇬🇼' },
    { code: '+240', name: 'Guinée équatoriale', flag: '🇬🇶' },
    { code: '+509', name: 'Haïti', flag: '🇭🇹' },
    { code: '+504', name: 'Honduras', flag: '🇭🇳' },
    { code: '+852', name: 'Hong Kong', flag: '🇭🇰' },
    { code: '+36', name: 'Hongrie', flag: '🇭🇺' },
    { code: '+354', name: 'Islande', flag: '🇮🇸' },
    { code: '+91', name: 'Inde', flag: '🇮🇳' },
    { code: '+62', name: 'Indonésie', flag: '🇮🇩' },
    { code: '+98', name: 'Iran', flag: '🇮🇷' },
    { code: '+964', name: 'Irak', flag: '🇮🇶' },
    { code: '+353', name: 'Irlande', flag: '🇮🇪' },
    { code: '+972', name: 'Israël', flag: '🇮🇱' },
    { code: '+39', name: 'Italie', flag: '🇮🇹' },
    { code: '+81', name: 'Japon', flag: '🇯🇵' },
    { code: '+962', name: 'Jordanie', flag: '🇯🇴' },
    { code: '+254', name: 'Kenya', flag: '🇰🇪' },
    { code: '+965', name: 'Koweït', flag: '🇰🇼' },
    { code: '+961', name: 'Liban', flag: '🇱🇧' },
    { code: '+231', name: 'Liberia', flag: '🇱🇷' },
    { code: '+218', name: 'Libye', flag: '🇱🇾' },
    { code: '+352', name: 'Luxembourg', flag: '🇱🇺' },
    { code: '+261', name: 'Madagascar', flag: '🇲🇬' },
    { code: '+265', name: 'Malawi', flag: '🇲🇼' },
    { code: '+60', name: 'Malaisie', flag: '🇲🇾' },
    { code: '+223', name: 'Mali', flag: '🇲🇱' },
    { code: '+356', name: 'Malte', flag: '🇲🇹' },
    { code: '+222', name: 'Mauritanie', flag: '🇲🇷' },
    { code: '+230', name: 'Maurice', flag: '🇲🇺' },
    { code: '+52', name: 'Mexique', flag: '🇲🇽' },
    { code: '+212', name: 'Maroc', flag: '🇲🇦' },
    { code: '+258', name: 'Mozambique', flag: '🇲🇿' },
    { code: '+95', name: 'Myanmar', flag: '🇲🇲' },
    { code: '+264', name: 'Namibie', flag: '🇳🇦' },
    { code: '+977', name: 'Népal', flag: '🇳🇵' },
    { code: '+31', name: 'Pays-Bas', flag: '🇳🇱' },
    { code: '+64', name: 'Nouvelle-Zélande', flag: '🇳🇿' },
    { code: '+227', name: 'Niger', flag: '🇳🇪' },
    { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
    { code: '+47', name: 'Norvège', flag: '🇳🇴' },
    { code: '+968', name: 'Oman', flag: '🇴🇲' },
    { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
    { code: '+507', name: 'Panama', flag: '🇵🇦' },
    { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
    { code: '+51', name: 'Pérou', flag: '🇵🇪' },
    { code: '+63', name: 'Philippines', flag: '🇵🇭' },
    { code: '+48', name: 'Pologne', flag: '🇵🇱' },
    { code: '+351', name: 'Portugal', flag: '🇵🇹' },
    { code: '+974', name: 'Qatar', flag: '🇶🇦' },
    { code: '+40', name: 'Roumanie', flag: '🇷🇴' },
    { code: '+7', name: 'Russie', flag: '🇷🇺' },
    { code: '+250', name: 'Rwanda', flag: '🇷🇼' },
    { code: '+966', name: 'Arabie saoudite', flag: '🇸🇦' },
    { code: '+221', name: 'Sénégal', flag: '🇸🇳' },
    { code: '+381', name: 'Serbie', flag: '🇷🇸' },
    { code: '+65', name: 'Singapour', flag: '🇸🇬' },
    { code: '+421', name: 'Slovaquie', flag: '🇸🇰' },
    { code: '+386', name: 'Slovénie', flag: '🇸🇮' },
    { code: '+252', name: 'Somalie', flag: '🇸🇴' },
    { code: '+27', name: 'Afrique du Sud', flag: '🇿🇦' },
    { code: '+211', name: 'Soudan du Sud', flag: '🇸🇸' },
    { code: '+34', name: 'Espagne', flag: '🇪🇸' },
    { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+249', name: 'Soudan', flag: '🇸🇩' },
    { code: '+46', name: 'Suède', flag: '🇸🇪' },
    { code: '+41', name: 'Suisse', flag: '🇨🇭' },
    { code: '+963', name: 'Syrie', flag: '🇸🇾' },
    { code: '+886', name: 'Taïwan', flag: '🇹🇼' },
    { code: '+255', name: 'Tanzanie', flag: '🇹🇿' },
    { code: '+66', name: 'Thaïlande', flag: '🇹🇭' },
    { code: '+228', name: 'Togo', flag: '🇹🇬' },
    { code: '+216', name: 'Tunisie', flag: '🇹🇳' },
    { code: '+90', name: 'Turquie', flag: '🇹🇷' },
    { code: '+256', name: 'Ouganda', flag: '🇺🇬' },
    { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
    { code: '+44', name: 'Royaume-Uni', flag: '🇬🇧' },
    { code: '+1', name: 'États-Unis', flag: '🇺🇸' },
    { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
    { code: '+998', name: 'Ouzbékistan', flag: '🇺🇿' },
    { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
    { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
    { code: '+967', name: 'Yémen', flag: '🇾🇪' },
    { code: '+260', name: 'Zambie', flag: '🇿🇲' },
    { code: '+263', name: 'Zimbabwe', flag: '🇿🇼' },
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
                      key={`${country.code}-${country.name}-${index}`}
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
                      <Text style={styles.countryCode}>{country.code}</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    paddingVertical: 16,
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
    paddingVertical: 16,
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
  countryCode: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
});
