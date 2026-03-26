import models from '../models/index.js'; 
const { User } = models;

class Controller {
    static async validate(validateFields, values) {
        //return Object.keys(validateFields).length;
        let successMessage = '';
        let errorMessage = '';
        for (const key of Object.keys(validateFields)) {
            const fieldValidations = validateFields[key].split("|")
            for (let index = 0; index < fieldValidations.length; index++) {
                if (fieldValidations[index] == 'required' && (values == undefined || values[key] == undefined) || values[key] == null) {
                    const nameTranslate = this.translateField(key)
                    errorMessage = errorMessage+' O campo '+nameTranslate+' é obrigatorio.'; 
                    break;
                }else if (fieldValidations[index].includes('min') || fieldValidations[index].includes('max')) {
                    const type = fieldValidations[index].split(':')[0]
                    const textLength = fieldValidations[index].split(':')[1]
                    if (type == 'min' && values[key].trim().length < textLength) {
                        errorMessage = errorMessage+' O campo '+this.translateField(key)+' deve conter no minimo '+textLength+' caracteres.'; 
                        break;
                    }else if(type == 'max' && values[key].length > textLength) {
                        errorMessage = errorMessage+' O campo '+(this.translateField(key))+' deve conter no maximo '+textLength+' caracteres.'; 
                        break;
                    }
                } else if (fieldValidations[index].includes('unique')) {
                    const field = key; 
                    const value = values[key];

                    // Fazemos a busca no banco
                    const exists = await User.findOne({ where: { [field]: value } });

                    if (exists) {
                        const nameTranslate = this.translateField(key);
                        errorMessage += ` O ${nameTranslate} informado já está em uso.`;
                        break;
                    }
                }
            }
        }

        if (errorMessage.length > 0) {
            return {status: 401, message: errorMessage};
        }else {
            return {status: 200, message: successMessage};
        }
        
    }
    
    static translateField(fieldName){
        let fields =  {
            name: 'Nome',
            password: 'Senha',
            email: 'Email',
            type: 'Tipo',
            price: 'Preço',
            status: 'status',
        };

        return fields[fieldName]
    }
}

export default Controller;