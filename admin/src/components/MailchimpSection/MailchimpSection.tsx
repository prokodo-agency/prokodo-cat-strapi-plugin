import { type FC, type ChangeEvent, useState, useEffect } from 'react';
import {
  Button,
  Divider,
  Field,
  FieldGroup,
  FieldHint,
  FieldLabel,
  FieldInput,
  Grid,
  GridItem,
  Box,
  Alert,
} from '@strapi/design-system';
import { Check, Disconnect } from '@strapi/icons';
import axios from 'axios';

interface MailchimpSectionProps {
  config: {
    mailchimp_server_prefix: string;
    mailchimp_list_id: string;
    mailchimp_segment_id?: string;
    mailchimp_template_id: string;
  };
  onChange: (field: keyof MailchimpSectionProps['config'], value: string) => void;
}

export const MailchimpSection: FC<MailchimpSectionProps> = ({ config, onChange }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check connection status on mount
    const checkStatus = async () => {
      try {
        const response = await axios.get('/prokodo-cat/mailchimp/status');
        setIsConnected(response.data.connected);
      } catch (err) {
        console.error('Error checking Mailchimp status:', err);
        setError('Failed to check Mailchimp connection status.');
      }
    };

    checkStatus();
  }, []);

  const handleConnect = () => {
    // Redirect to backend endpoint to initiate OAuth2 flow
    window.location.href = '/prokodo-cat/mailchimp/connect';
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post('/prokodo-cat/mailchimp/disconnect');
      setIsConnected(false);
      // Clear Mailchimp configuration fields
      onChange('mailchimp_server_prefix', '');
      onChange('mailchimp_list_id', '');
      onChange('mailchimp_segment_id', '');
      onChange('mailchimp_template_id', '');
    } catch (err) {
      console.error('Error disconnecting Mailchimp account:', err);
      setError('Failed to disconnect Mailchimp account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        mailchimp_server_prefix: config.mailchimp_server_prefix,
        mailchimp_list_id: config.mailchimp_list_id,
        mailchimp_segment_id: config.mailchimp_segment_id,
        mailchimp_template_id: config.mailchimp_template_id,
      };

      await axios.put('/prokodo-cat/mailchimp/config', payload);
      // Optionally, display a success notification here
    } catch (err) {
      console.error('Error saving Mailchimp configuration:', err);
      setError('Failed to save Mailchimp configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Divider />
      <Field>
        <FieldLabel>Mailchimp Integration</FieldLabel>
        {!isConnected ? (
          <Button onClick={handleConnect} startIcon={<Check />} disabled={loading}>
            Connect Mailchimp
          </Button>
        ) : (
          <FieldGroup name="mailchimp-settings" label="Mailchimp Settings" labelHidden>
            <Grid gap={4}>
              <GridItem col={6}>
                <Field>
                  <FieldLabel>Mailchimp Server Prefix</FieldLabel>
                  <FieldInput
                    type="text"
                    name="mailchimp_server_prefix"
                    value={config.mailchimp_server_prefix}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('mailchimp_server_prefix', e.target.value)}
                  />
                  <FieldHint>Enter your Mailchimp server prefix (e.g., us1, us2).</FieldHint>
                </Field>
              </GridItem>
              <GridItem col={6}>
                <Field>
                  <FieldLabel>Mailchimp List ID</FieldLabel>
                  <FieldInput
                    type="text"
                    name="mailchimp_list_id"
                    value={config.mailchimp_list_id}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('mailchimp_list_id', e.target.value)}
                  />
                  <FieldHint>Enter your Mailchimp List ID.</FieldHint>
                </Field>
              </GridItem>
              <GridItem col={6}>
                <Field>
                  <FieldLabel>Mailchimp Segment ID (Optional)</FieldLabel>
                  <FieldInput
                    type="text"
                    name="mailchimp_segment_id"
                    value={config.mailchimp_segment_id || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('mailchimp_segment_id', e.target.value)}
                  />
                  <FieldHint>Enter your Mailchimp Segment ID if applicable.</FieldHint>
                </Field>
              </GridItem>
              <GridItem col={6}>
                <Field>
                  <FieldLabel>Mailchimp Template ID</FieldLabel>
                  <FieldInput
                    type="text"
                    name="mailchimp_template_id"
                    value={config.mailchimp_template_id}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange('mailchimp_template_id', e.target.value)}
                  />
                  <FieldHint>Enter your Mailchimp Template ID.</FieldHint>
                </Field>
              </GridItem>
            </Grid>
            {error && (
              <Box marginTop={2}>
                <Alert variant="danger" title="Error">
                  {error}
                </Alert>
              </Box>
            )}
            <Box marginTop={4} display="flex" justifyContent="space-between">
              <Button
                variant="danger"
                onClick={handleDisconnect}
                startIcon={<Disconnect />}
                disabled={loading}
              >
                Disconnect Mailchimp
              </Button>
              <Button onClick={handleSave} startIcon={<Check />} disabled={saving}>
                {saving ? 'Saving...' : 'Save Mailchimp Settings'}
              </Button>
            </Box>
          </FieldGroup>
        )}
      </Field>
    </div>
  );
};
