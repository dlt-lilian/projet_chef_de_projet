import { Button, Icon, Input } from "@modules/common/components/my_ui";

const Hero = () => {
  return (
    <div className="space-y-5 mx-32">
      <p className="text-2xl">Boutons</p>
      <div className="space-x-2">
        <Button variant="primary">Coucou</Button>
        <Button variant="secondary">Coucou</Button>
        <Button variant="success">Coucou</Button>
        <Button variant="transparent">Coucou</Button>
        <Button iconTop="search" variant="transparent">Coucou</Button>
      </div>

      <p className="text-2xl">Icons</p>
      <div className="space-x-2">
        <Icon name="search" />
        <Icon name="chevron-down" size={16} color="currentColor" />
        <Icon name="trash-2" size={24} className="text-red-500" />
      </div>

      <p className="text-2xl">inputs</p>
      <div className="space-x-2">
        <Input variant="search" placeholder="Rechercher..." />
        <Input type="text" placeholder="Nom" />
        <Input type="email" placeholder="email@exemple.com" />
        <Input type="password" placeholder="Mot de passe" />
        <Input type="number" />
        <Input type="date" />
        <Input type="checkbox" />
        <Input type="radio" />
        <Input type="range" />
        <Input type="file" />
        <Input type="color" />
        <Input type="text" variant="search" placeholder="Rechercher..." />
      </div>

      <p>Product cards</p>
      <div className="grid grid-cols-4">
        <div>
          <img className="w-full aspect-square object-cover rounded-xl"
               src="https://picsum.photos/1920/1080"
               alt="#" />
            <h2 className="text-2xl text-center">Produit</h2>
            <p className="text-center">Prix</p>
            <Button size="full">Voir le produit</Button>
          </div>
      </div>
    </div>
  );
};

export default Hero;
