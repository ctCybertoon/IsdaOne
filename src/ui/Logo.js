import { Image } from 'react-native';
export default function Logo({ size = 48 }) {
  return <Image source={require('../../assets/logo.png')} style={{ width: size, height: size }} resizeMode="contain" accessibilityLabel="IsdaOne logo" />;
}
