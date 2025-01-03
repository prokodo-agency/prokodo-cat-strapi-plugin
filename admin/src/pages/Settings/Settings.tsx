// plugins/prokodoCAT/admin/src/pages/SettingsPage.tsx

import { type FC, type ChangeEvent, useEffect, useState } from 'react';
import {
  Tabs,
  Tab,
  TabPanels,
  TabPanel,
  TabsProvider,
  Box,
  Divider,
  Button,
  Typography,
  Field,
  FieldLabel,
  FieldHint,
  FieldInput,
  Select,
  Option,
  Grid,
  GridItem,
  Accordion,
  AccordionItem,
  AccordionToggle,
  AccordionContent,
  Notification,
} from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { AuthorsList } from '../../components/AuthorsList';
import { MailchimpSection } from '../../components/MailchimpSection';
import { useFetchClient } from '@strapi/helper-plugin';
import { Frequency, Weekday } from '../../../../server/types/config/config.enums';
import type { AuthorCategory } from '../../../../server/types/author';
import { type DefaultConfig, DefaultConfigSchema } from '../../../../server/types/config/settings';
import styled from 'styled-components';

// Styled component for Notification Container
const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
`;

const SettingsPage: FC = () => {
  const { get, post } = useFetchClient();

  // State for Generals Tab
  const [frequency, setFrequency] = useState<Frequency>(Frequency.Daily);
  const [newsletterSchedule, setNewsletterSchedule] = useState<string>('07:00');
  const [newsletterDay, setNewsletterDay] = useState<Weekday>(Weekday.Monday);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [domain, setDomain] = useState<string>('');
  const [plagiarizeMaxRetries, setPlagiarizeMaxRetries] = useState<number>(3);
  const [textModel, setTextModel] = useState<DefaultConfig['content_requirements']['textModel']>('gpt-4o');
  const [contentLength, setContentLength] = useState<number>(1000);
  const [contentLengthExact, setContentLengthExact] = useState<boolean>(false);
  const [publishArticlesByDefault, setPublishArticlesByDefault] = useState<boolean>(false);
  const [authors, setAuthors] = useState<AuthorCategory[]>([]);

  // Mailchimp Configuration State
  const [mailchimpConfig, setMailchimpConfig] = useState<{
    mailchimp_server_prefix: string;
    mailchimp_list_id: string;
    mailchimp_segment_id?: string;
    mailchimp_template_id: string;
  }>({
    mailchimp_server_prefix: '',
    mailchimp_list_id: '',
    mailchimp_segment_id: '',
    mailchimp_template_id: '',
  });

  // Available Authors and Categories
  const [availableAuthors, setAvailableAuthors] = useState<{ id: number; name: string }[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ id: number; name: string }[]>([]);

  // Notification State
  const [notifications, setNotifications] = useState<
    { id: number; type: 'success' | 'warning' | 'info'; message: string }[]
  >([]);

  const [nextNotificationId, setNextNotificationId] = useState<number>(1);

  // Notification Handlers
  const addNotification = (type: 'success' | 'warning' | 'info', message: string) => {
    setNotifications((prev) => [...prev, { id: nextNotificationId, type, message }]);
    setNextNotificationId((prev) => prev + 1);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  // Fetch existing general configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await get('/prokodo-cat/config');
        const data: DefaultConfig = response.data;

        // Set Generals Tab State
        setFrequency(data.newsletter_frequency);
        setNewsletterSchedule(data.newsletter_schedule);
        setNewsletterDay(data.newsletter_day);
        setTimezone(data.timezone);
        setDomain(data.content_requirements.domain);
        setPlagiarizeMaxRetries(data.content_requirements.plagiarize_max_retries);
        setTextModel(data.content_requirements.textModel);
        setContentLength(data.content_requirements.contentLength);
        setContentLengthExact(data.content_requirements.contentLengthExact);
        setPublishArticlesByDefault(data.content_requirements.publishArticlesByDefault || false);
        setAuthors(data.content_requirements.defaultAuthors || []);
      } catch (error) {
        addNotification('warning', 'Failed to fetch general configuration.');
        console.error(error);
      }
    };

    const fetchAuthorsAndCategories = async () => {
      try {
        const [authorsRes, categoriesRes] = await Promise.all([
          get('/api/authors'), // Adjust API endpoint as per your backend
          get('/api/categories'), // Adjust API endpoint as per your backend
        ]);

        setAvailableAuthors(authorsRes.data);
        setAvailableCategories(categoriesRes.data);
      } catch (error) {
        addNotification('warning', 'Failed to fetch authors and categories.');
        console.error(error);
      }
    };

    fetchConfig();
    fetchAuthorsAndCategories();
  }, [get]);

  // Fetch Mailchimp Configuration on mount
  useEffect(() => {
    const fetchMailchimpConfig = async () => {
      try {
        const response = await get('/prokodo-cat/mailchimp/status');
        if (response.data.connected) {
          // Fetch Mailchimp configuration
          const mailchimpData = await get('/prokodo-cat/mailchimp/config');
          setMailchimpConfig({
            mailchimp_server_prefix: mailchimpData.data.mailchimp_server_prefix,
            mailchimp_list_id: mailchimpData.data.mailchimp_list_id,
            mailchimp_segment_id: mailchimpData.data.mailchimp_segment_id,
            mailchimp_template_id: mailchimpData.data.mailchimp_template_id,
          });
        }
      } catch (error) {
        console.error('Error fetching Mailchimp configuration:', error);
      }
    };

    fetchMailchimpConfig();
  }, [get]);

  // Handlers for Generals Tab
  const handleAddAuthor = (): void => {
    setAuthors([...authors, { authorId: 0, categoryId: undefined }]);
  };

  const handleRemoveAuthor = (index: number): void => {
    const newAuthors = [...authors];
    newAuthors.splice(index, 1);
    setAuthors(newAuthors);
  };

  const handleAuthorChange = (index: number, pair: AuthorCategory): void => {
    const newAuthors = [...authors];
    newAuthors[index] = pair;
    setAuthors(newAuthors);
  };

  const handleSaveGenerals = async (): Promise<void> => {
    const payload: Partial<DefaultConfig> = {
        newsletter_frequency: frequency,
        newsletter_schedule: newsletterSchedule,
        newsletter_day: newsletterDay,
        timezone,
        content_requirements: {
            domain,
            plagiarize_max_retries: plagiarizeMaxRetries,
            textModel,
            contentLength,
            contentLengthExact,
            defaultAuthors: authors,
            publishArticlesByDefault,
        },
    };

    // Validate with zod
    const validation = DefaultConfigSchema.safeParse(payload);
    if (!validation.success) {
      addNotification('warning', 'Validation error. Please check your inputs.');
      console.error(validation.error);
      return;
    }

    try {
      await post('/prokodo-cat/config', payload);
      addNotification('success', 'General settings have been successfully saved.');
    } catch (error) {
      addNotification('warning', 'Failed to save general configuration.');
      console.error(error);
    }
  };

  // Handler for Mailchimp Configuration Changes
  const handleMailchimpChange = (field: keyof typeof mailchimpConfig, value: string): void => {
    setMailchimpConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <TabsProvider>
      {/* Notification Container */}
      <NotificationContainer>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            onClose={() => removeNotification(notification.id)}
            variant={notification.type}
            title={notification.type === 'success' ? 'Success' : 'Warning'}
          >
            {notification.message}
          </Notification>
        ))}
      </NotificationContainer>

      <Tabs label="prokodoCAT Settings">
        <Tab>Generals</Tab>
        <Tab>Advanced Settings</Tab>
      </Tabs>
      <TabPanels>
        {/* Generals Tab Panel */}
        <TabPanel>
          <Box padding={8}>
            <Typography variant="beta" textColor="neutral800">
              Generals
            </Typography>
            <Divider />
            <Grid gap={4}>
              <GridItem col={6}>
                <Field>
                  <FieldLabel>Domain</FieldLabel>
                  <FieldInput
                    type="text"
                    value={domain}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setDomain(e.target.value)}
                  />
                  <FieldHint>Enter your domain (e.g., example.com)</FieldHint>
                </Field>
              </GridItem>
              <GridItem col={6}>
                <Field>
                  <FieldLabel>Plagiarize Max Retries</FieldLabel>
                  <FieldInput
                    type="number"
                    value={plagiarizeMaxRetries}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPlagiarizeMaxRetries(Number(e.target.value))}
                    min={1}
                    max={10}
                  />
                  <FieldHint>Number of maximum retries for plagiarism checks (1-10)</FieldHint>
                </Field>
              </GridItem>
              <GridItem col={6}>
                <Field>
                  <FieldLabel>Text Model</FieldLabel>
                  <Select
                    placeholder="Select a text model"
                    value={textModel}
                    onChange={(value: string) => setTextModel(value as DefaultConfig['content_requirements']['textModel'])}
                  >
                    <Option value="gpt-4o">GPT-4o</Option>
                    <Option value="gpt-4o-mini">GPT-4o Mini</Option>
                    <Option value="gpt-4-turbo">GPT-4 Turbo</Option>
                    <Option value="gpt-4">GPT-4</Option>
                  </Select>
                  <FieldHint>Select the text model to use.</FieldHint>
                </Field>
              </GridItem>
              <GridItem col={6}>
                <Field>
                  <FieldLabel>Content Length</FieldLabel>
                  <FieldInput
                    type="number"
                    value={contentLength}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setContentLength(Number(e.target.value))}
                    min={1}
                    max={2500}
                  />
                  <FieldHint>Define the length of the content (1-2500).</FieldHint>
                </Field>
              </GridItem>
              <GridItem col={6}>
                <Field>
                  <FieldLabel>Content Length Exact</FieldLabel>
                  <Button
                    onClick={() => setContentLengthExact(!contentLengthExact)}
                    variant={contentLengthExact ? 'success' : 'default'}
                    endIcon={contentLengthExact ? <Check /> : null}
                  >
                    {contentLengthExact ? 'Exact Length Enabled' : 'Enable Exact Length'}
                  </Button>
                  <FieldHint>
                    Toggle to set the content length as exact.
                  </FieldHint>
                </Field>
              </GridItem>
            </Grid>

            {/* Publication Section */}
            <Box marginTop={8}>
              <Typography variant="beta" textColor="neutral800">
                Publication
              </Typography>
              <Divider />
              <Field>
                <FieldLabel>Publish Articles By Default</FieldLabel>
                <Button
                  onClick={() => setPublishArticlesByDefault(!publishArticlesByDefault)}
                  variant={publishArticlesByDefault ? 'success' : 'default'}
                  endIcon={publishArticlesByDefault ? <Check /> : null}
                >
                  {publishArticlesByDefault ? 'Enabled' : 'Enable Publishing'}
                </Button>
                <FieldHint>
                  Toggle to publish articles immediately upon creation.
                </FieldHint>
              </Field>

              {/* Authors List */}
              <Box marginTop={4}>
                <Typography variant="delta" textColor="neutral800">
                  Authors
                </Typography>
                <AuthorsList
                  authors={authors}
                  onAdd={handleAddAuthor}
                  onRemove={handleRemoveAuthor}
                  onChange={handleAuthorChange}
                  availableAuthors={availableAuthors}
                  availableCategories={availableCategories}
                />
              </Box>
            </Box>

            {/* Save Button */}
            <Box marginTop={6} display="flex" justifyContent="end">
              <Button onClick={handleSaveGenerals} startIcon={<Check />}>
                Save Generals
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Advanced Settings Tab Panel */}
        <TabPanel>
          <Box padding={8}>
            <Typography variant="beta" textColor="neutral800">
              Advanced Settings
            </Typography>
            <Divider />

            <Accordion>
              {/* Newsletter Accordion Item */}
              <AccordionItem>
                <AccordionToggle title="Newsletter" />
                <AccordionContent>
                  <Box marginTop={4}>
                    <Typography variant="delta" textColor="neutral800">
                      Generals
                    </Typography>
                    <Divider />
                    <Grid gap={4}>
                      <GridItem col={6}>
                        <Field>
                          <FieldLabel>Newsletter Frequency</FieldLabel>
                          <Select
                            placeholder="Select frequency"
                            value={frequency}
                            onChange={(value: string) => setFrequency(value as Frequency)}
                          >
                            <Option value="daily">Daily</Option>
                            <Option value="weekly">Weekly</Option>
                          </Select>
                          <FieldHint>Select how often the newsletter is sent.</FieldHint>
                        </Field>
                      </GridItem>
                      <GridItem col={6}>
                        <Field>
                          <FieldLabel>Newsletter Schedule</FieldLabel>
                          <FieldInput
                            type="time"
                            value={newsletterSchedule}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewsletterSchedule(e.target.value)}
                          />
                          <FieldHint>Set the time to send the newsletter (HH:mm).</FieldHint>
                        </Field>
                      </GridItem>
                      <GridItem col={6}>
                        <Field>
                          <FieldLabel>Newsletter Day</FieldLabel>
                          <Select
                            placeholder="Select a day"
                            value={newsletterDay}
                            onChange={(value: string) => setNewsletterDay(value as Weekday)}
                          >
                            <Option value="monday">Monday</Option>
                            <Option value="tuesday">Tuesday</Option>
                            <Option value="wednesday">Wednesday</Option>
                            <Option value="thursday">Thursday</Option>
                            <Option value="friday">Friday</Option>
                            <Option value="saturday">Saturday</Option>
                            <Option value="sunday">Sunday</Option>
                          </Select>
                          <FieldHint>Select the day to send the newsletter.</FieldHint>
                        </Field>
                      </GridItem>
                      <GridItem col={6}>
                        <Field>
                          <FieldLabel>Timezone</FieldLabel>
                          <Select
                            placeholder="Select timezone"
                            value={timezone}
                            onChange={(value: string) => setTimezone(value)}
                          >
                            {/* Ideally, populate with all IANA timezones using a library */}
                            <Option value="UTC">UTC</Option>
                            <Option value="America/New_York">America/New_York</Option>
                            <Option value="Europe/London">Europe/London</Option>
                            <Option value="Asia/Tokyo">Asia/Tokyo</Option>
                            {/* Add more timezones as needed */}
                          </Select>
                          <FieldHint>Select your timezone.</FieldHint>
                        </Field>
                      </GridItem>
                    </Grid>
                  </Box>
                </AccordionContent>
              </AccordionItem>

              {/* Mailchimp Accordion Item */}
              <AccordionItem>
                <AccordionToggle title="Mailchimp" />
                <AccordionContent>
                  <Box marginTop={4}>
                    <MailchimpSection
                      config={mailchimpConfig}
                      onChange={handleMailchimpChange}
                    />
                  </Box>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Save Button for Advanced Settings */}
            <Box marginTop={6} display="flex" justifyContent="end">
              <Button onClick={handleSaveGenerals} startIcon={<Check />}>
                Save Advanced Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </TabPanels>
    </TabsProvider>
  );
};

export default SettingsPage;
