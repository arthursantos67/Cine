from django.db import migrations

MOVIE_DATA = [
    {
        "title_en": "12 Angry Men",
        "title_pt": "12 Homens e uma Sentença",
        "synopsis_pt": (
            "Doze jurados devem deliberar o destino de um jovem acusado de assassinato. "
            "Enquanto todos parecem convictos da culpa do réu, um único jurado obstinado "
            "os força a reconsiderar as evidências antes de proferir um veredicto apressado."
        ),
        "synopsis_en": (
            "The jury in a New York City murder trial is frustrated by a single member whose "
            "skeptical caution forces them to reconsider the evidence before jumping to a hasty verdict."
        ),
    },
    {
        "title_en": "Back to the Future Part II",
        "title_pt": "De Volta para o Futuro Parte 2",
        "synopsis_pt": (
            "Marty McFly e Doc Brown viajam para 2015 para evitar uma catástrofe na família de Marty, "
            "mas acabam criando inadvertidamente um 1985 alternativo muito pior, dominado pelo corrupto "
            "Biff Tannen. Marty precisa voltar a 1955 para desfazer o estrago sem se cruzar com seu eu "
            "do passado, que está lá resolvendo os eventos do primeiro filme."
        ),
        "synopsis_en": (
            "Marty McFly and Doc Brown travel to 2015 to prevent a catastrophe in Marty's future family, "
            "only to inadvertently create a far worse alternate 1985 ruled by a corrupt Biff Tannen. "
            "Marty must travel back to 1955 to undo the damage while carefully avoiding his past self, "
            "who is there fixing the events of the original film."
        ),
    },
    {
        "title_en": "Casablanca",
        "title_pt": "Casablanca",
        "synopsis_pt": (
            "Um cínico americano expatriado, dono de um café em Casablanca, debate-se com a decisão de "
            "ajudar ou não sua ex-amante e o marido dela, um fugitivo, a escapar do Marrocos Francês "
            "no início da Segunda Guerra Mundial."
        ),
        "synopsis_en": (
            "A cynical expatriate American cafe owner struggles to decide whether or not to help his former "
            "lover and her fugitive husband escape French Morocco during the early days of World War II."
        ),
    },
    {
        "title_en": "Fight Club",
        "title_pt": "Clube da Luta",
        "synopsis_pt": (
            "Um funcionário insone e um fabricante de sabão despreocupado fundam um clube de luta "
            "clandestino que evolui para algo muito maior e mais perturbador."
        ),
        "synopsis_en": (
            "An insomniac office worker and a devil-may-care soap maker form an underground fight club "
            "that evolves into something much, much more."
        ),
    },
    {
        "title_en": "Forrest Gump",
        "title_pt": "Forrest Gump",
        "synopsis_pt": (
            "As presidências de Kennedy e Johnson, a Guerra do Vietnã, o escândalo Watergate e outros "
            "eventos históricos se desenrolam sob a perspectiva de um homem do Alabama com uma "
            "vida extraordinária."
        ),
        "synopsis_en": (
            "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other "
            "historical events unfold from the perspective of an Alabama man with an extraordinary life."
        ),
    },
    {
        "title_en": "Goodfellas",
        "title_pt": "Os Bons Companheiros",
        "synopsis_pt": (
            "A história de Henry Hill e sua vida na máfia, cobrindo seu relacionamento com sua esposa "
            "Karen e seus parceiros Jimmy Conway e Tommy DeVito."
        ),
        "synopsis_en": (
            "The story of Henry Hill and his life in the mob, covering his relationship with his wife "
            "Karen Hill and his mob partners Jimmy Conway and Tommy DeVito."
        ),
    },
    {
        "title_en": "Inception",
        "title_pt": "A Origem",
        "synopsis_pt": (
            "Um ladrão especializado em roubar segredos corporativos por meio da tecnologia de "
            "compartilhamento de sonhos recebe a tarefa inversa de plantar uma ideia na mente de um CEO."
        ),
        "synopsis_en": (
            "A thief who steals corporate secrets through the use of dream-sharing technology is given "
            "the inverse task of planting an idea into the mind of a C.E.O."
        ),
    },
    {
        "title_en": "Interstellar",
        "title_pt": "Interestelar",
        "synopsis_pt": (
            "Uma equipe de exploradores viaja por um buraco de minhoca no espaço na tentativa de "
            "garantir a sobrevivência da humanidade."
        ),
        "synopsis_en": (
            "A team of explorers travel through a wormhole in space in an attempt to ensure "
            "humanity's survival."
        ),
    },
    {
        "title_en": "Jaws",
        "title_pt": "Tubarão",
        "synopsis_pt": (
            "Quando um enorme tubarão-branco começa a aterrorizar a pacata cidade praiana de Amity Island, "
            "o chefe de polícia Martin Brody precisa superar seu medo da água e se unir a um biólogo "
            "marinho e a um experiente caçador de tubarões para deter a ameaça. O landmark de Steven "
            "Spielberg praticamente inventou o blockbuster de verão e permanece um dos grandes "
            "exercícios de suspense do cinema."
        ),
        "synopsis_en": (
            "When a massive great white shark begins terrorizing the small beach town of Amity Island, "
            "police chief Martin Brody must overcome his fear of the water and team up with a marine "
            "biologist and a grizzled shark hunter to stop it. Steven Spielberg's landmark thriller "
            "effectively invented the summer blockbuster and remains one of cinema's great exercises "
            "in suspense."
        ),
    },
    {
        "title_en": "Parasite",
        "title_pt": "Parasita",
        "synopsis_pt": (
            "A ganância e a discriminação de classe ameaçam a recém-formada relação simbiótica entre "
            "a rica família Park e o clã Kim, mergulhado na pobreza."
        ),
        "synopsis_en": (
            "Greed and class discrimination threaten the newly formed symbiotic relationship between "
            "the wealthy Park family and the destitute Kim clan."
        ),
    },
    {
        "title_en": "Pulp Fiction",
        "title_pt": "Pulp Fiction",
        "synopsis_pt": (
            "As vidas de dois pistoleiros da máfia, um boxeador, um gângster e sua esposa, e um casal "
            "de bandidos se entrelaçam em quatro histórias de violência e redenção em Los Angeles. "
            "O filme seminal de Quentin Tarantino tece sua narrativa não linear com diálogos afiados "
            "e uma trilha sonora eclética, reinventando o cinema noir e se tornando um dos filmes "
            "mais influentes da década."
        ),
        "synopsis_en": (
            "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits "
            "intertwine across four tales of violence and redemption in Los Angeles. Quentin Tarantino's "
            "landmark film weaves its nonlinear narrative with sharp, iconic dialogue and an eclectic "
            "soundtrack, reinventing crime cinema and becoming one of the most influential films "
            "of the decade."
        ),
    },
    {
        "title_en": "Schindler's List",
        "title_pt": "A Lista de Schindler",
        "synopsis_pt": (
            "Na Polônia ocupada pelos nazistas durante a Segunda Guerra Mundial, o industrial Oskar "
            "Schindler começa gradualmente a se preocupar com sua força de trabalho judaica ao "
            "testemunhar a perseguição promovida pelos nazistas."
        ),
        "synopsis_en": (
            "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually "
            "becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis."
        ),
    },
    {
        "title_en": "Se7en",
        "title_pt": "Se7en",
        "synopsis_pt": (
            "Dois detetives — um veterano prestes a se aposentar e um recém-chegado impetuoso — "
            "investigam uma série de assassinatos macabros, cada um encenado para representar um dos "
            "sete pecados capitais. À medida que o caso escala, eles percebem que o assassino está "
            "executando metodicamente um plano maior e aterrorizante. O filme culmina em um dos finais "
            "mais chocantes e devastadores do cinema."
        ),
        "synopsis_en": (
            "Two detectives — a seasoned veteran nearing retirement and a brash newcomer — investigate "
            "a series of gruesome murders, each staged to represent one of the seven deadly sins. As the "
            "case escalates, they realize the killer is methodically executing a larger, horrifying plan. "
            "The film builds to one of cinema's most shocking and devastating endings."
        ),
    },
    {
        "title_en": "Spirited Away",
        "title_pt": "A Viagem de Chihiro",
        "synopsis_pt": (
            "Durante a mudança de sua família para os subúrbios, uma menina mal-humorada de 10 anos "
            "se perde em um mundo governado por deuses, bruxas e espíritos, onde os humanos "
            "são transformados em animais."
        ),
        "synopsis_en": (
            "During her family's move to the suburbs, a sulky 10-year-old girl wanders into a world "
            "ruled by gods, witches, and spirits, and where humans are changed into beasts."
        ),
    },
    {
        "title_en": "The Dark Knight",
        "title_pt": "Batman: O Cavaleiro das Trevas",
        "synopsis_pt": (
            "Quando a ameaça conhecida como o Coringa semeia o caos em Gotham, Batman precisa enfrentar "
            "um dos maiores testes psicológicos e físicos de sua capacidade de combater a injustiça."
        ),
        "synopsis_en": (
            "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman "
            "must accept one of the greatest psychological and physical tests of his ability to "
            "fight injustice."
        ),
    },
    {
        "title_en": "The Godfather",
        "title_pt": "O Poderoso Chefão",
        "synopsis_pt": (
            "O patriarca envelhecido de uma dinastia do crime organizado transfere o controle de "
            "seu império clandestino a seu filho relutante."
        ),
        "synopsis_en": (
            "The aging patriarch of an organized crime dynasty transfers control of his "
            "clandestine empire to his reluctant son."
        ),
    },
    {
        "title_en": "The Lord of the Rings: The Fellowship of the Ring",
        "title_pt": "O Senhor dos Anéis: A Sociedade do Anel",
        "synopsis_pt": (
            "Um humilde Hobbit do Shire e oito companheiros partem em uma jornada para destruir o "
            "poderoso Um Anel e salvar a Terra-média do Senhor das Trevas Sauron."
        ),
        "synopsis_en": (
            "A meek Hobbit from the Shire and eight companions set out on a journey to destroy the "
            "powerful One Ring and save Middle-earth from the Dark Lord Sauron."
        ),
    },
    {
        "title_en": "The Matrix",
        "title_pt": "Matrix",
        "synopsis_pt": (
            "Thomas Anderson, um discreto engenheiro de software de dia e hacker à noite, é contatado "
            "por rebeldes que revelam que a realidade que ele conhece é uma prisão simulada construída "
            "por máquinas sencientes. Após tomar uma pílula vermelha, ele desperta para a verdade do "
            "mundo real e descobre que pode ser o libertador profetizado da humanidade. Ele precisa "
            "dominar habilidades extraordinárias para combater os agentes que policiam a simulação."
        ),
        "synopsis_en": (
            "Thomas Anderson, a mild-mannered software engineer by day and hacker by night, is contacted "
            "by rebels who reveal that reality as he knows it is a simulated prison constructed by "
            "sentient machines. After taking a red pill, he awakens to the truth of the real world and "
            "discovers he may be the prophesied liberator of humanity. He must master extraordinary "
            "abilities to fight the agents policing the simulation."
        ),
    },
    {
        "title_en": "The Shawshank Redemption",
        "title_pt": "Um Sonho de Liberdade",
        "synopsis_pt": (
            "Andy Dufresne, um banqueiro injustamente condenado pelo assassinato de sua esposa, é "
            "sentenciado à prisão de Shawshank. Ao longo das décadas, ele forma uma improvável amizade "
            "com o companheiro de prisão Ellis 'Red' Redding, encontrando formas sutis de manter sua "
            "esperança e humanidade no brutal ambiente carcerário. Sua paciência e determinação "
            "silenciosa culminam em um dos atos de redenção mais notáveis já realizados atrás das grades."
        ),
        "synopsis_en": (
            "Andy Dufresne, a banker wrongly convicted of murdering his wife, is sentenced to life in "
            "Shawshank State Penitentiary. Over decades he forms an unlikely friendship with fellow "
            "inmate Ellis 'Red' Redding, finding quiet ways to maintain his hope and humanity in the "
            "brutal world of prison. His patience and quiet determination ultimately lead to one of the "
            "most remarkable acts of redemption ever committed behind bars."
        ),
    },
    {
        "title_en": "The Shining",
        "title_pt": "O Iluminado",
        "synopsis_pt": (
            "Jack Torrance, um escritor em crise, aceita o trabalho de zelador do isolado Hotel Overlook "
            "durante o inverno, levando sua esposa e seu jovem filho Danny. À medida que as sombrias "
            "forças sobrenaturais do hotel começam a dominá-lo, Jack cede à loucura violenta. Danny, "
            "dotado de uma habilidade psíquica chamada 'o brilho', precisa sobreviver ao "
            "colapso assassino do pai."
        ),
        "synopsis_en": (
            "Jack Torrance, a struggling writer, takes a job as the winter caretaker of the isolated "
            "Overlook Hotel, bringing his wife and young son Danny along. As the hotel's dark supernatural "
            "forces begin to overwhelm him, Jack descends into violent madness. Danny, gifted with a "
            "psychic ability called 'the shining', must survive his father's murderous breakdown."
        ),
    },
    {
        "title_en": "The Silence of the Lambs",
        "title_pt": "O Silêncio dos Inocentes",
        "synopsis_pt": (
            "A estagiária do FBI Clarice Starling é enviada para entrevistar o psiquiatra caníbal "
            "encarcerado Hannibal Lecter a fim de obter insights sobre outro serial killer conhecido "
            "como Buffalo Bill. À medida que as intensas trocas psicológicas evoluem para um vínculo "
            "perturbador, Clarice corre contra o tempo para encontrar a última vítima de Buffalo Bill "
            "antes que seja tarde demais."
        ),
        "synopsis_en": (
            "FBI trainee Clarice Starling is sent to interview the imprisoned cannibalistic psychiatrist "
            "Hannibal Lecter to gain insight into another serial killer known as Buffalo Bill. As their "
            "intense psychological exchanges deepen into an unsettling bond, Clarice races to find "
            "Buffalo Bill's latest captive before it is too late."
        ),
    },
    {
        "title_en": "The Social Network",
        "title_pt": "A Rede Social",
        "synopsis_pt": (
            "Baseado na história real de Mark Zuckerberg, o filme narra a fundação do Facebook em um "
            "dormitório de Harvard em 2003 e as batalhas judiciais que se seguiram sobre propriedade "
            "e traição. Contado por meio de depoimentos judiciais intercalados, explora temas de "
            "ambição, propriedade intelectual e o custo humano do sucesso. Apesar de criar a maior "
            "rede social do mundo, Zuckerberg se vê isolado das pessoas que ajudaram a construí-la."
        ),
        "synopsis_en": (
            "Based on the true story of Mark Zuckerberg, the film chronicles the founding of Facebook "
            "from a Harvard dorm room in 2003 and the legal battles that followed over ownership and "
            "betrayal. Told through intercut deposition hearings, it explores themes of ambition, "
            "intellectual property, and the human cost of success. Despite creating the world's largest "
            "social network, Zuckerberg finds himself isolated from the people who helped build it."
        ),
    },
]


def seed_portuguese_translations(apps, schema_editor):
    Movie = apps.get_model("catalog", "Movie")

    index = {m["title_en"]: m for m in MOVIE_DATA}

    for movie in Movie.objects.all():
        data = index.get(movie.title)
        if data is None:
            continue

        translations = dict(movie.translations or {})
        en_translation = translations.get("en-US", {})
        en_translation["title"] = data["title_en"]
        en_translation["synopsis"] = data["synopsis_en"]
        translations["en-US"] = en_translation

        movie.title = data["title_pt"]
        movie.synopsis = data["synopsis_pt"]
        movie.translations = translations
        movie.save(update_fields=["title", "synopsis", "translations"])


def reverse_portuguese_translations(apps, schema_editor):
    Movie = apps.get_model("catalog", "Movie")

    index = {m["title_pt"]: m for m in MOVIE_DATA}

    for movie in Movie.objects.all():
        data = index.get(movie.title)
        if data is None:
            continue

        translations = dict(movie.translations or {})
        translations.pop("en-US", None)

        movie.title = data["title_en"]
        movie.synopsis = data["synopsis_en"]
        movie.translations = translations
        movie.save(update_fields=["title", "synopsis", "translations"])


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0012_alter_roomtypepricing_id"),
    ]

    operations = [
        migrations.RunPython(
            seed_portuguese_translations,
            reverse_code=reverse_portuguese_translations,
        ),
    ]
