from xml.etree import ElementTree as ET

class MetadataParser():
    def __init__(self, metadata_str):
        self.dc_namespace = "http://purl.org/dc/elements/1.1/"
        self.opf_namespace = "http://www.idpf.org/2007/opf"
        self.metadata_str = metadata_str
        self.parse_metadata()

    def get_text(self, el, force_list=False):
        if el is None:
            return None

        if type(el) == list:
            l = [e.text for e in el]
            if len(l) > 1 or force_list:
                return l
            elif len(l) == 1:
                return l[0]
            else:
                return None

        return el.text

    def get_identifiers(self, el):
        if el is None:
            return None

        identifiers = {}
        for e in el:
            print(e.attrib)
            # get the  opf:scheme attribute as key
            scheme = e.attrib.get(f'{{{self.opf_namespace}}}scheme', None)
            print(scheme)
            if scheme is not None:
                identifiers[scheme] = e.text
        if len(identifiers) == 0:
            return None
        return identifiers

    def parse_metadata(self):
        self.metadata = {}
        tree = ET.ElementTree(ET.fromstring(self.metadata_str))
        root = tree.getroot()
        

        print(str(root))

        title_el = tree.find(f'.//{{{self.dc_namespace}}}title')
        self.metadata['title'] = self.get_text(title_el)

        authors_el = tree.findall(f'.//{{{self.dc_namespace}}}creator')
        self.metadata['authors'] = self.get_text(authors_el, force_list=True)
        
        subjects_el = tree.findall(f'.//{{{self.dc_namespace}}}subject')
        self.metadata['subjects'] = self.get_text(subjects_el)
        
        descriptions_el = tree.findall(f'.//{{{self.dc_namespace}}}description')
        self.metadata['descriptions'] = self.get_text(descriptions_el)

        publisher_el = tree.find(f'.//{{{self.dc_namespace}}}publisher')
        self.metadata['publisher'] = self.get_text(publisher_el)

        language_el = tree.find(f'.//{{{self.dc_namespace}}}language')
        self.metadata['language'] = self.get_text(language_el)

        date_el = tree.find(f'.//{{{self.dc_namespace}}}date')
        self.metadata['date'] = self.get_text(date_el)

        identifiers_el = tree.findall(f'.//{{{self.dc_namespace}}}identifier')
        print(identifiers_el)
        self.metadata['identifiers'] = self.get_identifiers(identifiers_el)
        
meta_str = ""

with open("./test.opf", "r") as f:
    meta_str = f.read()

parser = MetadataParser(meta_str)
print(parser.metadata)
