import BasePage from '../components/BasePage';
import { Heading } from '../components/ui/Heading';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Section } from '../components/ui/Section';

export default function ExemploEstilo() {
  return (
    <BasePage>
      <Section className="text-center">
        <Heading size="lg" className="mb-4">Página Exemplo (Padrão Landing)</Heading>
        <Text muted className="mb-8">Use estes componentes e classes para manter o padrão visual.</Text>
        <div className="flex justify-center gap-3">
          <Button variant="primary">Ação principal</Button>
          <Button variant="ghost">Ação secundária</Button>
          <Button variant="success">Sucesso</Button>
        </div>
      </Section>
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <Heading as="h3" size="sm">Card 1</Heading>
            <Text muted>Descrição do card 1.</Text>
          </Card>
          <Card>
            <Heading as="h3" size="sm">Card 2</Heading>
            <Text muted>Descrição do card 2.</Text>
          </Card>
          <Card>
            <Heading as="h3" size="sm">Card 3</Heading>
            <Text muted>Descrição do card 3.</Text>
          </Card>
        </div>
      </Section>
    </BasePage>
  );
}
